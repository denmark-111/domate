import { Trash2 } from 'lucide-react';
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
      <div className="shrink-0 mt-0.5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={message.author?.fullName || 'User'}
            className="w-9 h-9 rounded-full object-cover bg-surface-container-high shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold shrink-0">
            {(message.author?.fullName || message.author?.email || 'U').split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
        )}
      </div>

      {/* Message content */}
      <div className={`flex flex-col min-w-0 max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Author name + timestamp */}
        <div className={`flex items-baseline gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
          <span className="font-mono-label text-xs font-semibold text-on-surface">
            {message.author?.fullName || message.author?.email || 'Unknown'}
          </span>
          <span className="font-body-sm text-[11px] text-secondary">
            {formattedDate} {formattedTime}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={`px-4 py-2.5 rounded-DEFAULT text-sm font-body-md leading-relaxed max-w-full ${
            isOwnMessage
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-low border border-outline-variant text-on-surface'
          }`}
        >
          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word]">{message.content}</p>
        </div>

        {/* Delete button (only for own messages) */}
        {isOwnMessage && (
          <button
            onClick={() => onDelete?.(message.id)}
            className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-mono-label text-[11px] text-secondary hover:text-error cursor-pointer"
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
