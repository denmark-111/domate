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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div
        className="relative bg-surface-container-lowest rounded-t-DEFAULT sm:rounded-DEFAULT border border-outline-variant shadow-xl w-full sm:max-w-2xl sm:mx-4 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="font-headline-md text-base font-bold text-on-surface">
            {isEditing ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-on-surface rounded-DEFAULT hover:bg-surface-container-low transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="announcement-title"
              className="block font-mono-label text-xs uppercase font-bold text-on-surface mb-1.5"
            >
              Title
            </label>
            <input
              id="announcement-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-sm outline-none focus:border-primary transition-colors"
              placeholder="Announcement title"
              maxLength={255}
            />
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="announcement-content"
              className="block font-mono-label text-xs uppercase font-bold text-on-surface mb-1.5"
            >
              Content
            </label>
            <textarea
              id="announcement-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="6"
              className="w-full px-4 py-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-sm outline-none focus:border-primary transition-colors resize-none"
              placeholder="Write your announcement..."
              maxLength={5000}
            />
            <div className="text-right font-body-sm text-xs text-secondary mt-1">
              {content.length}/5000
            </div>
          </div>

          {/* Pinned toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPinned(!pinned)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                pinned ? 'bg-primary' : 'bg-outline-variant'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-surface-container-lowest rounded-full transition-transform ${
                  pinned ? 'translate-x-5' : ''
                }`}
              />
            </button>
            <span className="font-body-sm text-sm font-semibold text-on-surface">Pin this announcement</span>
          </div>

          {/* Attachments */}
          <div>
            <label className="block font-mono-label text-xs uppercase font-bold text-on-surface mb-1.5">
              Attachments
            </label>

            {/* Uploaded files list */}
            {attachments.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {attachments.map((attachment, index) => {
                  const previewUrl = previewUrls[attachment.id] || previewUrls[attachment.storagePath];
                  const isImage = isImageAttachment(attachment);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 bg-surface-container-low border border-outline-variant rounded-DEFAULT"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isImage && previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={attachment.fileName}
                            className="w-8 h-8 rounded-DEFAULT object-cover border border-outline-variant shrink-0"
                          />
                        ) : isImage ? (
                          <div className="w-8 h-8 flex items-center justify-center bg-surface-container-high rounded-DEFAULT border border-outline-variant shrink-0">
                            <Image size={14} className="text-secondary" />
                          </div>
                        ) : (
                          <File size={14} className="text-secondary shrink-0" />
                        )}
                        <span className="font-mono-label text-xs text-on-surface truncate">
                          {attachment.fileName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 text-secondary hover:text-error hover:bg-error-container rounded-DEFAULT transition-colors shrink-0"
                        title="Remove file"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Currently uploading files */}
            {loadingFiles.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {loadingFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 p-2.5 bg-surface-container-low border border-outline-variant rounded-DEFAULT"
                  >
                    <Loader size={14} className="text-primary animate-spin shrink-0" />
                    <span className="font-mono-label text-xs text-secondary">{file.name}</span>
                    <span className="font-label-caps text-xs text-primary ml-auto font-bold">Uploading...</span>
                  </div>
                ))}
              </div>
            )}

            {/* File picker */}
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-DEFAULT border border-dashed border-outline-variant bg-surface-container-lowest cursor-pointer hover:border-primary transition-colors">
              <Upload size={16} className="text-secondary" />
              <span className="font-body-sm text-xs text-secondary">
                {loadingFiles.length > 0
                  ? 'Add another file...'
                  : 'Click to upload files'}
              </span>
              <span className="font-mono-label text-xs text-outline ml-auto">Max 10 MB per file</span>
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
            <div className="p-3 bg-error-container border border-error rounded-DEFAULT text-xs text-on-error-container font-medium">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-DEFAULT font-label-caps text-xs font-bold uppercase text-secondary hover:bg-surface-container-low transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || loadingFiles.length > 0}
            className="px-4 py-2 rounded-DEFAULT font-label-caps text-xs font-bold uppercase bg-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <Loader size={16} className="animate-spin" />}
            {isSubmitting
              ? 'Saving...'
              : isEditing
              ? 'Save Changes'
              : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementForm;