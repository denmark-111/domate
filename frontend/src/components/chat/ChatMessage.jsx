import React from 'react';
import { Trash2, User } from 'lucide-react';
import { supabaseStorageService } from '../../services/index.js';

const ChatMessage = ({ message, isOwnMessage, onDelete }) => {
  const avatarUrl = message.author?.avatarUrl
    ? supabaseStorageService.getAvatarUrl(message.author.avatarUrl)
    : null;

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedDate = new Date(message.createdAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className={`flex gap-3 group ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={message.author?.fullName || 'User'}
            className="w-9 h-9 rounded-full object-cover bg-bg-tertiary"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center">
            <User size={16} className="text-text-tertiary" />
          </div>
        )}
      </div>

      {/* Message content */}
      <div className={`flex flex-col max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Author name + timestamp */}
        <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-semibold text-text-secondary">
            {message.author?.fullName || message.author?.email || 'Unknown'}
          </span>
          <span className="text-[10px] text-text-tertiary">
            {formattedDate} {formattedTime}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isOwnMessage
              ? 'bg-button text-white rounded-tr-md'
              : 'bg-bg-secondary border border-border text-text rounded-tl-md'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Delete button (only for own messages) */}
        {isOwnMessage && (
          <button
            onClick={() => onDelete?.(message.id)}
            className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-text-tertiary hover:text-red-500"
          >
            <Trash2 size={12} />
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
