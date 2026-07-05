import React, { useState, useRef, useEffect } from 'react';
import { Loader, Camera, Trash2, Check } from 'lucide-react';
import { supabaseStorageService, profileService } from '../../services/index.js';
import { useAuth } from '../../context/AuthContext';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ProfileTab = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localFilePreview, setLocalFilePreview] = useState(null);
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
      setAvatarPreview(currentAvatarUrl);
      setSelectedFile(null);
      setLocalFilePreview(null);
      setError('');
      setSuccess('');
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (localFilePreview) {
        URL.revokeObjectURL(localFilePreview);
      }
    };
  }, [localFilePreview]);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('Avatar image must be under 10 MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setError('');
    setSelectedFile(file);

    if (localFilePreview) {
      URL.revokeObjectURL(localFilePreview);
    }

    setLocalFilePreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    if (localFilePreview) {
      URL.revokeObjectURL(localFilePreview);
    }
    setSelectedFile(null);
    setLocalFilePreview(null);
    setAvatarPreview(null);
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

      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  const displayUrl = localFilePreview || avatarPreview;

  return (
    <div className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-start gap-4">
          <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Avatar</label>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-border bg-bg-secondary flex items-center justify-center">
                {displayUrl ? (
                  <img
                    src={displayUrl}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-text-secondary">
                    {(user?.fullName || user?.email || 'U').split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                )}
              </div>
              <div
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={24} className="text-white" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-medium text-text-accent hover:underline text-left"
              >
                Change photo
              </button>
              {(selectedFile || avatarPreview) && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-sm font-medium text-error-text hover:underline flex items-center gap-1 text-left"
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="profile-fullName"
            className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2"
          >
            Full Name
          </label>
          <input
            id="profile-fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 border-border bg-input-bg text-text outline-none focus:border-input-border-focus transition-colors"
            placeholder="Your full name"
            maxLength={255}
          />
        </div>

        <div>
          <label
            htmlFor="profile-email"
            className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2"
          >
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-3 rounded-lg border-2 border-border bg-bg-tertiary text-text-secondary outline-none cursor-not-allowed"
          />
          <p className="text-xs text-text-secondary mt-1">Email cannot be changed</p>
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

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="px-6 py-2.5 rounded-lg font-bold bg-button hover:bg-button-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
          >
            {(isSubmitting || isUploading) && <Loader size={16} className="animate-spin" />}
            {isUploading
              ? 'Uploading...'
              : isSubmitting
              ? 'Saving...'
              : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileTab;
