import { supabaseStorageService } from '../../services/index.js';

const AVATAR_SIZE = 'w-7 h-7';

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const ActiveUsersBar = ({ users }) => {
  if (!users || users.length === 0) return null;

  const maxVisible = 4;
  const visible = users.slice(0, maxVisible);
  const remainder = users.length - maxVisible;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((u) => (
        <div
          key={u.userId}
          className="relative"
        >
          <div
            className={`${AVATAR_SIZE} rounded-full bg-button flex items-center justify-center text-white text-[10px] font-bold overflow-hidden ring-2 ring-bg-secondary`}
            title={u.fullName || 'Unknown'}
          >
            {u.avatarUrl ? (
              <img
                src={supabaseStorageService.getAvatarUrl(u.avatarUrl)}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(u.fullName)
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-bg-secondary rounded-full" />
        </div>
      ))}
      {remainder > 0 && (
        <div
          className={`${AVATAR_SIZE} rounded-full bg-bg-tertiary flex items-center justify-center text-text-secondary text-[10px] font-bold ring-2 ring-bg-secondary`}
          title={`${remainder} more viewer${remainder > 1 ? 's' : ''}`}
        >
          +{remainder}
        </div>
      )}
    </div>
  );
};

export default ActiveUsersBar;
