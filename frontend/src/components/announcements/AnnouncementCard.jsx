import React, { useState } from 'react';
import { Pin, PinOff, Paperclip, Download, Edit3, Trash2, Calendar, User } from 'lucide-react';
import { supabaseStorageService } from '../../services/index.js';

const AnnouncementCard = ({ announcement, isOwner, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const contentPreview = announcement.content?.length > 300
    ? announcement.content.slice(0, 300) + '...'
    : announcement.content;

  const handleDownload = async (attachment) => {
    setDownloading(attachment.id);
    try {
      const url = await supabaseStorageService.getFileUrl(attachment.storagePath);
      if (url) {
        window.open(url, '_blank');
      }
    } finally {
      setDownloading(null);
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

      {/* Attachments */}
      {announcement.attachments?.length > 0 && (
        <div className="px-5 pb-5">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-text-secondary uppercase tracking-wider">
            <Paperclip size={14} />
            Attachments ({announcement.attachments.length})
          </div>
          <div className="space-y-1.5">
            {announcement.attachments.map((attachment) => (
              <button
                key={attachment.id}
                onClick={() => handleDownload(attachment)}
                className="w-full flex items-center justify-between p-2.5 bg-bg rounded-lg border border-border-light hover:border-accent/30 hover:bg-bg-hover transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {downloading === attachment.id ? (
                    <svg className="animate-spin shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="10" />
                    </svg>
                  ) : (
                    <Download size={14} className="text-text-secondary shrink-0" />
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
    </div>
  );
};

export default AnnouncementCard;