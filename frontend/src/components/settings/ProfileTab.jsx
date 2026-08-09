import { useState, useEffect, useRef } from 'react';
import { Loader, Check, Pencil } from 'lucide-react';
import { supabaseStorageService, profileService } from '../../services/index.js';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Input from '../common/Input';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ProfileTab = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);

  const currentAvatarUrl = user?.avatarUrl
    ? supabaseStorageService.getAvatarUrl(user.avatarUrl)
    : null;

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [initialFullName, setInitialFullName] = useState(user?.fullName || '');
  const [avatarPreview, setAvatarPreview] = useState(currentAvatarUrl);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localPreview, setLocalPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const prevUserIdRef = useRef(user?.id);
  useEffect(() => {
    if (user?.id && user.id !== prevUserIdRef.current) {
      prevUserIdRef.current = user.id;
      setFullName(user.fullName || '');
      setInitialFullName(user.fullName || '');
      setAvatarPreview(currentAvatarUrl);
    }
  }, [user?.id, user?.fullName, currentAvatarUrl]);

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
      <div className="mb-6">
        <h2 className="font-headline-md text-lg font-semibold text-on-surface mb-1">
          Profile Settings
        </h2>
        <p className="font-body-sm text-sm text-secondary">
          Update your public avatar and display information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative inline-block group">
            <button
              type="button"
              onClick={handleAvatarClick}
              title="Change profile photo"
              className="relative w-20 h-20 rounded-full border-2 border-outline-variant hover:border-primary bg-surface-container-high transition-colors cursor-pointer block overflow-hidden"
            >
              {displayUrl ? (
                <img src={displayUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-headline-md text-xl font-bold text-on-surface flex items-center justify-center h-full">
                  {(user?.fullName || user?.email || 'U').split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleAvatarClick}
              title="Change profile photo"
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-on-primary border-2 border-surface-container-lowest hover:scale-110 transition-transform cursor-pointer shadow-xs"
            >
              <Pencil size={12} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="space-y-4 max-w-xl">
          <Input
            id="profile-fullName"
            label="Full name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            maxLength={255}
          />

          <Input
            id="profile-email"
            label="Email Address"
            type="email"
            value={user?.email || ''}
            disabled
            helperText="Email address cannot be changed."
          />
        </div>

        {error && (
          <div className="p-3.5 bg-error-container text-on-error-container border border-error/30 rounded-DEFAULT text-sm font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-surface-container-high text-on-surface border border-outline-variant rounded-DEFAULT text-sm font-medium flex items-center gap-2">
            <Check size={16} className="text-primary" />
            {success}
          </div>
        )}

        {isDirty && (
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || isUploading}
            >
              {(isSubmitting || isUploading) && <Loader size={14} className="animate-spin" />}
              Save changes
            </Button>
            <Button
              type="button"
              variant="subtle"
              onClick={() => {
                setFullName(initialFullName);
                setAvatarPreview(currentAvatarUrl);
                setSelectedFile(null);
                if (localPreview) URL.revokeObjectURL(localPreview);
                setLocalPreview(null);
                setError('');
                setSuccess('');
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileTab;


