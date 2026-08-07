import { supabaseStorageService } from '../../services/index.js';

const TypingIndicator = ({ typingUsers = [] }) => {
  if (!typingUsers || typingUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-3 pt-1 select-none animate-fadeIn">
      {/* Avatar stack matching ChatMessage sizing */}
      <div className="flex items-center -space-x-2 shrink-0">
        {typingUsers.map((u) => {
          const avatarUrl = u.avatarUrl
            ? supabaseStorageService.getAvatarUrl(u.avatarUrl)
            : null;
          const initials = (u.fullName || 'U')
            .split(/\s+/)
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return avatarUrl ? (
            <img
              key={u.userId}
              src={avatarUrl}
              alt={u.fullName || 'User'}
              title={u.fullName || 'User'}
              className="w-8 h-8 rounded-full object-cover bg-surface-container-high ring-2 ring-surface-container-lowest shrink-0"
            />
          ) : (
            <div
              key={u.userId}
              title={u.fullName || 'User'}
              className="w-8 h-8 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center ring-2 ring-surface-container-lowest shrink-0"
            >
              {initials}
            </div>
          );
        })}
      </div>

      {/* Message bubble matching ChatMessage styling */}
      <div className="px-3.5 py-2 rounded-DEFAULT bg-surface-container-low border border-outline-variant text-on-surface flex items-center gap-1.5 shadow-2xs">
        <span
          className="w-1.5 h-1.5 rounded-full bg-outline animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-outline animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-outline animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
};

export default TypingIndicator;
