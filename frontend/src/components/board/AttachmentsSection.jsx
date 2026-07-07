import React from 'react';
import { Upload, File, Image as ImageIcon, Loader, Trash2 } from 'lucide-react';

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageAttachment = (attachment) => {
  return attachment.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachment.fileName);
};

const AttachmentsSection = ({
  attachments,
  loadingFiles,
  previewUrls,
  isSavingAttachments,
  readOnly,
  onFileSelect,
  onRemoveAttachment,
}) => {
  return (
    <div>
      <label className="block text-sm font-semibold text-text mb-2">
        Attachments {attachments.length > 0 && <span className="text-text-secondary">({attachments.length})</span>}
      </label>

      {attachments.length === 0 && (
        <p className="text-sm text-text-secondary">No attachments</p>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2 mb-3">
          {attachments.map((attachment, index) => {
            const previewUrl = previewUrls[attachment.storagePath];
            const isImage = isImageAttachment(attachment);
            return (
              <div
                key={attachment.storagePath || attachment.id || index}
                className="flex items-center justify-between p-2 bg-bg-tertiary rounded-lg border border-border"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {isImage && previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={attachment.fileName}
                      className="w-10 h-10 rounded-md object-cover border border-border shrink-0"
                    />
                  ) : isImage ? (
                    <div className="w-10 h-10 flex items-center justify-center bg-bg rounded-md border border-border shrink-0">
                      <ImageIcon size={16} className="text-text-secondary" />
                    </div>
                  ) : (
                    <File size={16} className="text-text-secondary shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-text-accent truncate">{attachment.fileName}</p>
                    <p className="text-xs text-text-secondary">
                      {attachment.fileSize ? formatFileSize(attachment.fileSize) : ''}
                    </p>
                  </div>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(index)}
                    disabled={isSavingAttachments}
                    className="p-1.5 text-text-secondary hover:text-red-500 rounded transition-colors shrink-0 ml-2 disabled:opacity-50"
                    title="Remove file"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!readOnly && (
        <>
          {loadingFiles.length > 0 && (
            <div className="space-y-2 mb-3">
              {loadingFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 p-2 bg-bg-tertiary rounded-lg border border-border"
                >
                  <Loader size={16} className="text-accent animate-spin shrink-0" />
                  <span className="text-sm text-text-secondary">{file.name}</span>
                  <span className="text-xs text-accent ml-auto">Uploading...</span>
                </div>
              ))}
            </div>
          )}

          <label className={`flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-border bg-bg cursor-pointer hover:border-accent/50 transition-colors ${isSavingAttachments ? 'opacity-50 pointer-events-none' : ''}`}>
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
              onChange={onFileSelect}
              className="hidden"
              disabled={loadingFiles.length > 0 || isSavingAttachments}
            />
          </label>
        </>
      )}
    </div>
  );
};

export default AttachmentsSection;
