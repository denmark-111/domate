import { supabase } from '../lib/supabaseClient.js';

/**
 * Upload a file to Supabase Storage for an announcement.
 * Path format: attachments/announcements/{workspaceId}/{uuid}/{filename}
 * The backend validates that the storagePath starts with attachments/announcements/{workspaceId}/
 */
export const supabaseStorageService = {
  /**
   * Upload a single file and return the attachment metadata needed by the backend.
   * @param {string} workspaceId
   * @param {File} file
   * @returns {Promise<{ fileName: string, fileSize: number, mimeType: string, storagePath: string }>}
   */
  uploadAnnouncementFile: async (workspaceId, file) => {
    const uuid = crypto.randomUUID();
    const storagePath = `announcements/${workspaceId}/${uuid}/${file.name}`;

    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Verify the upload succeeded
    if (!data?.path) {
      throw new Error('File upload succeeded but no path was returned');
    }

    return {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storagePath: data.path,
    };
  },

  /**
   * Upload a single file to a task and return the attachment metadata needed by the backend.
   * Path format: tasks/{workspaceId}/{uuid}/{filename}
   * The backend validates that the storagePath starts with tasks/{workspaceId}/
   * @param {string} workspaceId
   * @param {File} file
   * @returns {Promise<{ fileName: string, fileSize: number, mimeType: string, storagePath: string }>}
   */
  uploadTaskFile: async (workspaceId, file) => {
    const uuid = crypto.randomUUID();
    const storagePath = `tasks/${workspaceId}/${uuid}/${file.name}`;

    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    if (!data?.path) {
      throw new Error('File upload succeeded but no path was returned');
    }

    return {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storagePath: data.path,
    };
  },

  /**
   * Delete a file from Supabase Storage (used when removing attachments before saving).
   * @param {string} storagePath - The path of the file to delete
   */
  deleteFile: async (storagePath) => {
    const { error } = await supabase.storage
      .from('attachments')
      .remove([storagePath]);

    if (error) {
      console.error('Failed to delete file from storage:', error.message);
    }
  },

  /**
   * Get a signed URL for a storage path so the user can view/download the file.
   * Uses createSignedUrl because the bucket is private — public URLs won't work.
   * @param {string} storagePath
   * @param {number} [expiresIn=60] - Time in seconds until the URL expires
   * @returns {Promise<string>}
   */
  getFileUrl: async (storagePath, expiresIn = 60) => {
    const { data, error } = await supabase.storage
      .from('attachments')
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      console.error('Failed to create signed URL:', error.message);
      return '';
    }

    return data?.signedUrl || '';
  },

  /**
   * Upload an avatar image to the avatars bucket (public bucket).
   * The file is uploaded directly from the client to Supabase Storage,
   * and the returned storage path is sent to the backend for persistence.
   * @param {File} file - The avatar image file
   * @param {string} userId - The user's UUID (used for path scoping)
   * @returns {Promise<string>} - The storage path of the uploaded avatar
   */
  uploadAvatar: async (file, userId) => {
    const ext = file.name.split('.').pop() || 'png';
    const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }

    if (!data?.path) {
      throw new Error('Avatar upload succeeded but no path was returned');
    }

    return data.path;
  },

  /**
   * Resolve an avatar URL for display.
   *
   * OAuth providers (Google, GitHub, etc.) store an absolute URL like
   * "https://lh3.googleusercontent.com/..." directly in avatarUrl.
   * Locally-uploaded avatars store a relative storage path (e.g.
   * "avatars/{userId}/{uuid}.png") which needs getPublicUrl().
   *
   * @param {string} avatarUrlOrPath - The avatarUrl value from the user record
   * @returns {string}
   */
  getAvatarUrl: (avatarUrlOrPath) => {
    if (!avatarUrlOrPath) return '';
    // Already an absolute URL — return as-is (e.g. Google OAuth picture)
    if (avatarUrlOrPath.startsWith('http://') || avatarUrlOrPath.startsWith('https://')) {
      return avatarUrlOrPath;
    }
    // Relative storage path — resolve via the avatars bucket
    const { data } = supabase.storage.from('avatars').getPublicUrl(avatarUrlOrPath);
    return data?.publicUrl || '';
  },
};