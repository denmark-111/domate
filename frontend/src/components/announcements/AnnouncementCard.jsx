import React, { useState, useEffect } from 'react';
import { Pin, PinOff, Paperclip, ExternalLink, Edit3, Trash2, Calendar, User, Image, X, Maximize2 } from 'lucide-react';
import { supabaseStorageService } from '../../services/index.js';

const AnnouncementCard = ({ announcement, isOwner, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [opening, setOpening] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [loadingImages, setLoadingImages] = useState(true);
  const contentPreview = announcement.content?.length > 300
    ? announcement.content.slice(0, 300) + '...'
    : announcement.content;

  const handleOpen = async (attachment) => {
    setOpening(attachment.id);
    try {
      const url = await supabaseStorageService.getFileUrl(attachment.storagePath);
      if (url) {
        window.open(url, '_blank');
      }
    } finally {
      setOpening(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImageAttachment = (attachment) => {
    return attachment.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachment.fileName);
  };

  const imageAttachments = announcement.attachments?.filter(isImageAttachment) || [];
  const fileAttachments = announcement.attachments?.filter((att) => !isImageAttachment(att)) || [];

  useEffect(() => {
    // Reset URL state when attachments change (e.g. after editing)
    setImageUrls({});
    setLoadingImages(true);

    const currentImageAttachments = announcement.attachments?.filter(isImageAttachment) || [];

    if (currentImageAttachments.length === 0) {
      setLoadingImages(false);
      return;
    }

    let cancelled = false;

    const loadImageUrls = async () => {
      const urls = {};
      for (const attachment of currentImageAttachments) {
        if (cancelled) return;
        try {
          const url = await supabaseStorageService.getFileUrl(attachment.storagePath, 3600);
          if (!cancelled && url) {
            urls[attachment.id] = url;
          }
        } catch (err) {
          console.error('Failed to load image URL for', attachment.fileName, err);
        }
      }
      if (!cancelled) {
        setImageUrls(urls);
        setLoadingImages(false);
      }
    };

    loadImageUrls();

    return () => {
      cancelled = true;
    };
  }, [announcement.id, announcement.attachments]);

  return (
    <div
      className={`bg-bg-secondary rounded-2xl border shadow-sm transition-all ${
        announcement.pinned ? 'border-accent/40 ring-1 ring-accent/20' : 'border-border'
      }`}
    >
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {announcement.pinned && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-bold uppercase rounded-full tracking-wider">
                  <Pin size={12} /> Pinned
                </span>
              )}
            </div>
            <h3
              className="text-lg font-bold text-text cursor-pointer hover:text-accent transition-colors"
              onClick={() => setExpanded(!expanded)}
            >
              {announcement.title}
            </h3>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onEdit(announcement)}
                className="p-2 text-text-secondary hover:text-accent hover:bg-bg-tertiary rounded-lg transition-colors"
                title="Edit announcement"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => onDelete(announcement)}
                className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete announcement"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Author & date */}
        <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <User size={14} />
            {announcement.author?.fullName || announcement.author?.email || 'Unknown'}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            {formatDate(announcement.createdAt)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-3">
        <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
          {expanded ? announcement.content : contentPreview}
        </div>
        {announcement.content?.length > 300 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-xs font-bold text-accent hover:text-accent/80 transition-colors"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Image Attachments - displayed inline */}
      {imageAttachments.length > 0 && (
        <div className="px-5 pb-3">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
            <Image size={14} />
            Images ({imageAttachments.length})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {imageAttachments.map((attachment) => (
              <div key={attachment.id} className="relative group aspect-square">
                {loadingImages && !imageUrls[attachment.id] ? (
                  <div className="w-full h-full flex items-center justify-center bg-bg rounded-lg border border-border-light">
                    <svg className="animate-spin text-text-secondary" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="10" />
                    </svg>
                  </div>
                ) : imageUrls[attachment.id] ? (
                  <>
                    <img
                      src={imageUrls[attachment.id]}
                      alt={attachment.fileName}
                      className="w-full h-full object-cover rounded-lg border border-border-light cursor-pointer bg-bg transition-transform hover:scale-[1.02]"
                      onClick={() => setFullscreenImage(attachment.id)}
                      loading="lazy"
                    />
                    <button
                      onClick={() => setFullscreenImage(attachment.id)}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                      title="View full size"
                    >
                      <Maximize2 size={12} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleOpen(attachment)}
                    className="w-full h-full flex items-center justify-center bg-bg rounded-lg border border-border-light hover:border-accent/30 transition-colors"
                  >
                    <div className="text-center">
                      <ExternalLink size={16} className="mx-auto mb-1 text-text-secondary" />
                      <span className="text-[10px] text-text-secondary block truncate px-1">
                        {attachment.fileName}
                      </span>
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-image Attachments */}
      {fileAttachments.length > 0 && (
        <div className="px-5 pb-5">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
            <Paperclip size={14} />
            Attachments ({fileAttachments.length})
          </div>
          <div className="space-y-1.5">
            {fileAttachments.map((attachment) => (
              <button
                key={attachment.id}
                onClick={() => handleOpen(attachment)}
                className="w-full flex items-center justify-between p-2.5 bg-bg rounded-lg border border-border-light hover:border-accent/30 hover:bg-bg-hover transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {opening === attachment.id ? (
                    <svg className="animate-spin shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="10" />
                    </svg>
                  ) : (
                    <ExternalLink size={14} className="text-text-secondary shrink-0" />
                  )}
                  <span className="text-sm font-medium text-text truncate">
                    {attachment.fileName}
                  </span>
                </div>
                <span className="text-[10px] text-text-secondary font-semibold shrink-0 ml-2">
                  {formatFileSize(attachment.fileSize)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {fullscreenImage && imageUrls[fullscreenImage] && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-bg-secondary rounded-full shadow-lg border border-border hover:bg-bg-hover transition-colors z-10"
              title="Close"
            >
              <X size={16} />
            </button>
            <img
              src={imageUrls[fullscreenImage]}
              alt="Full size"
              className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementCard;