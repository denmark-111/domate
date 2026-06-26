import React, { useState, useEffect, useRef } from 'react';
import { X, Paperclip, Upload, File, Trash2, Loader, Image } from 'lucide-react';
import { supabaseStorageService } from '../../services/index.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const AnnouncementForm = ({
  workspaceId,
  announcement,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const isEditing = !!announcement;
  const objectUrlsRef = useRef({}); // tracks ObjectURLs for cleanup

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [attachments, setAttachments] = useState([]); // uploaded attachment metadata
  const [loadingFiles, setLoadingFiles] = useState([]); // files currently uploading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [previewUrls, setPreviewUrls] = useState({}); // attachment.id -> preview URL

  const isImageAttachment = (attachment) => {
    return attachment.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachment.fileName);
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(objectUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = {};
    };
  }, []);

  // Initialize form when editing, and load signed URLs for existing image attachments
  useEffect(() => {
    let cancelled = false;

    const initForm = async () => {
      if (announcement) {
        setTitle(announcement.title || '');
        setContent(announcement.content || '');
        setPinned(announcement.pinned || false);
        setAttachments(announcement.attachments || []);

        // Load signed URLs for existing image attachments
        const imageAtts = (announcement.attachments || []).filter(isImageAttachment);
        const urls = {};
        for (const att of imageAtts) {
          try {
            const url = await supabaseStorageService.getFileUrl(att.storagePath, 3600);
            if (!cancelled && url) {
              urls[att.id] = url;
            }
          } catch (err) {
            console.error('Failed to load preview for', att.fileName, err);
          }
        }
        if (!cancelled) {
          setPreviewUrls((prev) => ({ ...prev, ...urls }));
        }
      } else {
        setTitle('');
        setContent('');
        setPinned(false);
        setAttachments([]);
        setPreviewUrls({});
      }
      if (!cancelled) {
        setLoadingFiles([]);
        setError('');
      }
    };

    initForm();
    return () => { cancelled = true; };
  }, [announcement, isOpen]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newLoading = [...loadingFiles];
    const newAttachments = [...attachments];

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds the 10 MB limit.`);
        continue;
      }

      const loadingId = crypto.randomUUID();
      newLoading.push({ id: loadingId, name: file.name, status: 'uploading' });
      setLoadingFiles([...newLoading]);

      try {
        const metadata = await supabaseStorageService.uploadAnnouncementFile(
          workspaceId,
          file
        );
        newAttachments.push(metadata);

        // Create preview for image files using the uploaded file's URL
        if (file.type.startsWith('image/')) {
          try {
            const url = await supabaseStorageService.getFileUrl(metadata.storagePath, 3600);
            if (url) {
              setPreviewUrls((prev) => ({ ...prev, [metadata.storagePath]: url }));
            }
          } catch {
            // preview not essential
          }
        }

        // Remove from loading, mark as done
        const idx = newLoading.findIndex((l) => l.id === loadingId);
        if (idx !== -1) {
          newLoading.splice(idx, 1);
        }
      } catch (err) {
        // Remove from loading, show error
        const idx = newLoading.findIndex((l) => l.id === loadingId);
        if (idx !== -1) {
          newLoading.splice(idx, 1);
        }
        setError(err.message || `Failed to upload "${file.name}"`);
      }

      setAttachments([...newAttachments]);
      setLoadingFiles([...newLoading]);
    }

    // Reset the input so the same file can be re-selected
    e.target.value = '';
  };

  const removeAttachment = async (index) => {
    const attachment = attachments[index];
    // Clean up preview URL
    setPreviewUrls((prev) => {
      const next = { ...prev };
      delete next[attachment.id];
      delete next[attachment.storagePath];
      return next;
    });
    // If it was newly uploaded (has no DB id, meaning not saved yet), delete from storage
    if (!attachment.id) {
      try {
        await supabaseStorageService.deleteFile(attachment.storagePath);
      } catch {
        // Silently fail - storage cleanup is best-effort
      }
    }
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    setIsSubmitting(true);

    const data = {
      title: title.trim(),
      content: content.trim(),
      pinned,
    };

    // Only include attachments if there are any or if editing and we need to clear them
    // When editing, if the user removed all attachments, send empty array to clear
    if (attachments.length > 0 || isEditing) {
      data.attachments = attachments.map((a) => ({
        fileName: a.fileName,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
        storagePath: a.storagePath,
      }));
    }

    try {
      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative bg-bg rounded-2xl border border-border shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold text-text">
            {isEditing ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div>
            <label
              htmlFor="announcement-title"
              className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2"
            >
              Title
            </label>
            <input
              id="announcement-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-border bg-input-bg text-text outline-none focus:border-input-border-focus transition-colors"
              placeholder="Announcement title"
              maxLength={255}
            />
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="announcement-content"
              className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2"
            >
              Content
            </label>
            <textarea
              id="announcement-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="6"
              className="w-full px-4 py-3 rounded-lg border-2 border-border bg-input-bg text-text outline-none focus:border-input-border-focus transition-colors resize-none"
              placeholder="Write your announcement..."
              maxLength={5000}
            />
            <div className="text-right text-xs text-text-secondary mt-1">
              {content.length}/5000
            </div>
          </div>

          {/* Pinned toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPinned(!pinned)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                pinned ? 'bg-accent' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  pinned ? 'translate-x-5' : ''
                }`}
              />
            </button>
            <span className="text-sm font-medium text-text">Pin this announcement</span>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">
              Attachments
            </label>

            {/* Uploaded files list */}
            {attachments.length > 0 && (
              <div className="space-y-2 mb-3">
                {attachments.map((attachment, index) => {
                  const previewUrl = previewUrls[attachment.id] || previewUrls[attachment.storagePath];
                  const isImage = isImageAttachment(attachment);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg border border-border-light"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isImage && previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={attachment.fileName}
                            className="w-10 h-10 rounded-md object-cover border border-border-light shrink-0"
                          />
                        ) : isImage ? (
                          <div className="w-10 h-10 flex items-center justify-center bg-bg rounded-md border border-border-light shrink-0">
                            <Image size={16} className="text-text-secondary" />
                          </div>
                        ) : (
                          <File size={16} className="text-text-secondary shrink-0" />
                        )}
                        <span className="text-sm font-medium text-text truncate">
                          {attachment.fileName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                        title="Remove file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Currently uploading files */}
            {loadingFiles.length > 0 && (
              <div className="space-y-2 mb-3">
                {loadingFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 p-3 bg-bg-secondary rounded-lg border border-border-light"
                  >
                    <Loader size={16} className="text-accent animate-spin shrink-0" />
                    <span className="text-sm text-text-secondary">{file.name}</span>
                    <span className="text-xs text-accent ml-auto">Uploading...</span>
                  </div>
                ))}
              </div>
            )}

            {/* File picker */}
            <label className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-border bg-input-bg cursor-pointer hover:border-accent/50 transition-colors">
              <Upload size={18} className="text-text-secondary" />
              <span className="text-sm font-medium text-text-secondary">
                {loadingFiles.length > 0
                  ? 'Add another file...'
                  : 'Click to upload files'}
              </span>
              <span className="text-xs text-text-secondary ml-auto">Max 10 MB per file</span>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={loadingFiles.length > 0}
              />
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error-text">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg font-bold text-text-secondary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || loadingFiles.length > 0}
            className="px-6 py-2.5 rounded-lg font-bold bg-button hover:bg-button-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
          >
            {isSubmitting && <Loader size={16} className="animate-spin" />}
            {isSubmitting
              ? 'Saving...'
              : isEditing
              ? 'Save Changes'
              : 'Create Announcement'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementForm;