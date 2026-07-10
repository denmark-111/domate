import React, { useState, useEffect, useRef } from 'react';
import { Pin, PinOff, Paperclip, ExternalLink, Edit3, Trash2, Calendar, User, Image, X, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabaseStorageService } from '../../services/index.js';

const AnnouncementCard = ({ announcement, isOwner, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [opening, setOpening] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState(true);
  const thumbnailContainerRef = useRef(null);
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

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setFullscreenImage(imageAttachments[index]?.id);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    const newIndex = (selectedImageIndex + 1) % imageAttachments.length;
    setSelectedImageIndex(newIndex);
    setFullscreenImage(imageAttachments[newIndex].id);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    const newIndex = (selectedImageIndex - 1 + imageAttachments.length) % imageAttachments.length;
    setSelectedImageIndex(newIndex);
    setFullscreenImage(imageAttachments[newIndex].id);
  };

  const handleThumbnailClick = (e, index) => {
    e.stopPropagation();
    setSelectedImageIndex(index);
    setFullscreenImage(imageAttachments[index].id);
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!thumbnailContainerRef.current) return;
    const selected = thumbnailContainerRef.current.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedImageIndex]);

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
      const displayedAttachments = currentImageAttachments.slice(0, 3);

      // Load first 3 images in parallel (these are the ones immediately displayed)
      const initialPromises = displayedAttachments.map((attachment) =>
        supabaseStorageService.getFileUrl(attachment.storagePath, 3600).then((url) => ({ attachment, url }))
      );

      const initialResults = await Promise.allSettled(initialPromises);

      for (const result of initialResults) {
        if (cancelled) return;
        if (result.status === 'fulfilled' && result.value.url) {
          urls[result.value.attachment.id] = result.value.url;
        }
      }

      // Set URLs for displayed images and turn off loading so UI renders
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

  // Load remaining images only when the lightbox is opened
  useEffect(() => {
    if (!fullscreenImage) return;

    const remainingAttachments = imageAttachments.slice(3);
    const alreadyLoaded = remainingAttachments.every((att) => imageUrls[att.id]);

    if (remainingAttachments.length === 0 || alreadyLoaded) return;

    let cancelled = false;

    const loadRemaining = async () => {
      const promises = remainingAttachments.map((attachment) =>
        supabaseStorageService
          .getFileUrl(attachment.storagePath, 3600)
          .then((url) => ({ attachment, url }))
          .catch((err) => {
            console.error('Failed to load image URL for', attachment.fileName, err);
            return null;
          })
      );

      const results = await Promise.allSettled(promises);

      for (const result of results) {
        if (cancelled) return;
        if (result.status === 'fulfilled' && result.value && result.value.url) {
          setImageUrls((prev) => ({
            ...prev,
            [result.value.attachment.id]: result.value.url,
          }));
        }
      }
    };

    loadRemaining();

    return () => {
      cancelled = true;
    };
  }, [fullscreenImage, imageAttachments, imageUrls]);

  return (
    <div
      className="rounded-xl border border-border bg-bg overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 pb-2 sm:pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {announcement.pinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-secondary text-text-secondary text-[10px] font-semibold rounded-full mb-1.5">
                <Pin size={11} /> Pinned
              </span>
            )}
            <h3
              className="text-base font-semibold text-text cursor-pointer hover:text-accent transition-colors break-words"
              onClick={() => setExpanded(!expanded)}
            >
              {announcement.title}
            </h3>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => onEdit(announcement)}
                className="p-1.5 text-text-secondary hover:text-accent hover:bg-bg-tertiary rounded-lg transition-colors"
                title="Edit announcement"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={() => onDelete(announcement)}
                className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete announcement"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Author & date */}
        <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-button flex items-center justify-center text-white text-[9px] font-bold overflow-hidden shrink-0">
              {announcement.author?.avatarUrl ? (
                <img src={supabaseStorageService.getAvatarUrl(announcement.author.avatarUrl)} alt="" className="w-full h-full object-cover" />
              ) : (
                (announcement.author?.fullName || announcement.author?.email || 'U').split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
              )}
            </div>
            {announcement.author?.fullName || announcement.author?.email || 'Unknown'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(announcement.createdAt)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-5 pb-2 sm:pb-3">
        <div className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed break-words">
          {expanded ? announcement.content : contentPreview}
        </div>
        {announcement.content?.length > 300 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Image Attachments - displayed inline */}
      {imageAttachments.length > 0 && (
        <div className="px-4 sm:px-5 pb-2 sm:pb-3">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-text-secondary">
            <Image size={13} />
            Images ({imageAttachments.length})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {imageAttachments.slice(0, 3).map((attachment, index) => {
              const isThirdWithMore = index === 2 && imageAttachments.length > 3;
              return (
                <div key={attachment.id} className="relative group aspect-square">
                  {loadingImages && !imageUrls[attachment.id] ? (
                    <div className="w-full h-full flex items-center justify-center bg-bg-secondary rounded-lg border border-border-light">
                      <svg className="animate-spin text-text-secondary" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="10" />
                      </svg>
                    </div>
                  ) : imageUrls[attachment.id] ? (
                    <>
                      <img
                        src={imageUrls[attachment.id]}
                        alt={attachment.fileName}
                        className="w-full h-full object-cover rounded-lg border border-border-light cursor-pointer bg-bg-secondary"
                        onClick={() => handleImageClick(index)}
                        loading="lazy"
                      />
                      {isThirdWithMore && (
                        <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center cursor-pointer" onClick={() => handleImageClick(index)}>
                          <span className="text-white font-semibold text-lg">+{imageAttachments.length - 2}</span>
                        </div>
                      )}
                      <button
                        onClick={() => handleImageClick(index)}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/50 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
                        title="View full size"
                      >
                        <Maximize2 size={11} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleOpen(attachment)}
                      className="w-full h-full flex items-center justify-center bg-bg-secondary rounded-lg border border-border-light hover:border-accent/30 transition-colors"
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
              );
            })}
          </div>
        </div>
      )}

      {/* Non-image Attachments */}
      {fileAttachments.length > 0 && (
        <div className="px-4 sm:px-5 pb-3 sm:pb-4">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-text-secondary">
            <Paperclip size={13} />
            Attachments ({fileAttachments.length})
          </div>
          <div className="space-y-1">
            {fileAttachments.map((attachment) => (
              <button
                key={attachment.id}
                onClick={() => handleOpen(attachment)}
                className="w-full flex items-center justify-between p-2.5 bg-bg-secondary rounded-lg hover:bg-bg-tertiary transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {opening === attachment.id ? (
                    <svg className="animate-spin shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="10" />
                    </svg>
                  ) : (
                    <ExternalLink size={13} className="text-text-secondary shrink-0" />
                  )}
                  <span className="text-sm font-medium text-text truncate">
                    {attachment.fileName}
                  </span>
                </div>
                <span className="text-[10px] text-text-secondary font-medium shrink-0 ml-2">
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
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setFullscreenImage(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 p-2 bg-bg-secondary rounded-full border border-border hover:bg-bg-tertiary transition-colors z-50"
            title="Close"
          >
            <X size={16} />
          </button>

          {/* Previous Button */}
          {imageAttachments.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-bg-secondary/90 rounded-full border border-border hover:bg-bg-tertiary transition-colors z-50"
              title="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Next Button */}
          {imageAttachments.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-bg-secondary/90 rounded-full border border-border hover:bg-bg-tertiary transition-colors z-50"
              title="Next image"
            >
              <ChevronRight size={24} />
            </button>
          )}

          <div onClick={(e) => e.stopPropagation()}>
            {/* Main Image */}
            <img
              src={imageUrls[fullscreenImage]}
              alt="Full size"
              className="max-w-[90vw] max-h-[70vh] rounded-xl object-contain block mx-auto"
            />
          </div>

          {/* Thumbnail Navigation */}
          {imageAttachments.length > 1 && (
            <div ref={thumbnailContainerRef} className="absolute bottom-4 left-4 right-4 flex items-center bg-black/60 backdrop-blur-sm p-2 rounded-xl overflow-x-auto z-40 gap-2">
              {imageAttachments.map((attachment, index) => (
                <button
                  key={attachment.id}
                  data-selected={index === selectedImageIndex}
                  onClick={(e) => handleThumbnailClick(e, index)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    index === selectedImageIndex
                      ? 'border-accent'
                      : 'border-border-light hover:border-text-secondary'
                  }`}
                >
                  {imageUrls[attachment.id] ? (
                    <img
                      src={imageUrls[attachment.id]}
                      alt={attachment.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-bg">
                      <svg className="animate-spin text-text-secondary" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="10" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnnouncementCard;