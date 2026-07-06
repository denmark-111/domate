import { useState, useEffect, useRef } from 'react';
import { Loader, Check, Camera } from 'lucide-react';
import { supabaseStorageService, profileService } from '../../services/index.js';
import { useAuth } from '../../context/AuthContext';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ProfileTab = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState('');
  const [initialFullName, setInitialFullName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localPreview, setLocalPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentAvatarUrl = user?.avatarUrl
    ? supabaseStorageService.getAvatarUrl(user.avatarUrl)
    : null;

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setInitialFullName(user.fullName || '');
      setAvatarPreview(currentAvatarUrl);
      setSelectedFile(null);
      setLocalPreview(null);
      setError('');
      setSuccess('');
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const isDirty = fullName.trim() !== initialFullName || selectedFile !== null || avatarPreview !== currentAvatarUrl;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('Avatar must be under 10 MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setError('');
    setSelectedFile(file);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      let avatarUrl = user?.avatarUrl;

      if (selectedFile) {
        setIsUploading(true);
        avatarUrl = await supabaseStorageService.uploadAvatar(selectedFile, user.id);
        setIsUploading(false);
      }

      if (avatarPreview === null && !selectedFile) {
        avatarUrl = null;
      }

      const result = await profileService.updateProfile({
        fullName: fullName.trim(),
        avatarUrl,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      setUser((prev) => ({
        ...prev,
        fullName: fullName.trim(),
        avatarUrl,
      }));

      setInitialFullName(fullName.trim());
      setAvatarPreview(avatarUrl);
      setSelectedFile(null);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  const displayUrl = localPreview || avatarPreview;

  return (
    <div>
      <h2 className="text-base font-semibold text-text mb-1">Profile</h2>
      <p className="text-sm text-text-secondary mb-6">Update your personal information.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleAvatarClick}
            className="relative group w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-bg-secondary flex items-center justify-center shrink-0 cursor-pointer"
          >
            {displayUrl ? (
              <img src={displayUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-text-secondary">
                {(user?.fullName || user?.email || 'U').split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={18} className="text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="profile-fullName"
              className="block text-sm font-medium text-text mb-1.5"
            >
              Full name
            </label>
            <input
              id="profile-fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm outline-none focus:border-input-border-focus transition-colors"
              placeholder="Your full name"
              maxLength={255}
            />
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="block text-sm font-medium text-text mb-1.5"
            >
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-tertiary text-text-secondary text-sm outline-none cursor-not-allowed"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error-text">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-label-done-bg border border-label-done-text rounded-lg text-sm text-label-done-text font-medium flex items-center gap-2">
            <Check size={16} />
            {success}
          </div>
        )}

        {isDirty && (
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-button hover:bg-button-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(isSubmitting || isUploading) && <Loader size={14} className="animate-spin" />}
              Save changes
            </button>
            <button
              type="button"
              onClick={() => {
                setFullName(initialFullName);
                setAvatarPreview(currentAvatarUrl);
                setSelectedFile(null);
                if (localPreview) URL.revokeObjectURL(localPreview);
                setLocalPreview(null);
                setError('');
                setSuccess('');
              }}
              className="px-5 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text hover:bg-bg-tertiary transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileTab;
