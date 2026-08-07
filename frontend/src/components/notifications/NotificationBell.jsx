import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext.jsx';

const timeAgo = (dateStr) => {
  const now = Date.now();
  const date = new Date(dateStr);
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationBell({ fullWidth = false, collapsed = false }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications, isLoading, hasMore } = useNotifications();
  const [open, setOpen] = useState(false);
  const [fetched, setFetched] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = useCallback(() => {
    if (!open) {
      setOpen(true);
      if (!fetched) {
        fetchNotifications({ page: 1, limit: 20 });
        setFetched(true);
      }
    } else {
      setOpen(false);
    }
  }, [open, fetched, fetchNotifications]);

  const handleNotificationClick = useCallback(async (notification) => {
    await markAsRead(notification.id);
    setOpen(false);
    const url = notification.data?.url;
    if (url) {
      navigate(url);
    }
  }, [markAsRead, navigate]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = Math.floor(notifications.length / 20) + 1;
      fetchNotifications({ page: nextPage, limit: 20 });
    }
  }, [isLoading, hasMore, notifications.length, fetchNotifications]);

  const dropdownPositionClass = fullWidth
    ? (collapsed ? 'left-full bottom-0 ml-2' : 'left-0 bottom-full mb-2')
    : 'right-0 top-full mt-2';

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`} ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className={
          fullWidth
            ? 'w-full flex items-center gap-3 px-3 py-2 rounded-DEFAULT text-xs font-body-sm font-medium transition-colors text-left cursor-pointer overflow-hidden text-secondary hover:text-on-surface hover:bg-surface-container-high'
            : 'p-2 text-secondary hover:bg-surface-container-high rounded-full transition-colors relative cursor-pointer'
        }
        aria-label="Notifications"
        title={collapsed ? 'Notifications' : undefined}
      >
        {fullWidth ? (
          <>
            <div className="w-6 h-6 flex items-center justify-center shrink-0 relative">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center bg-error text-on-error text-[9px] font-bold rounded-full px-0.5 leading-none pointer-events-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            {!collapsed && <span className="truncate whitespace-nowrap">Notifications</span>}
          </>
        ) : (
          <>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-error text-on-error text-[10px] font-bold rounded-full px-1 leading-none border-2 border-surface pointer-events-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {open && (
        <div className={`absolute ${dropdownPositionClass} w-80 sm:w-96 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-xl z-50 max-h-[70vh] flex flex-col`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant shrink-0">
            <h3 className="text-sm font-bold text-on-surface">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-secondary hover:text-on-surface transition-colors cursor-pointer"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 thin-scrollbar">
            {isLoading && notifications.length === 0 ? (
              <div className="p-6 text-xs text-secondary text-center">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-xs text-secondary text-center">No notifications</div>
            ) : (
              <>
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface-container-low transition-colors border-b border-outline-variant/40 last:border-b-0 cursor-pointer ${
                      !n.readAt ? 'bg-surface-container-low/50' : ''
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {n.actor?.avatarUrl ? (
                        <img
                          src={n.actor.avatarUrl}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold">
                          {(n.actor?.fullName || '?')[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs ${!n.readAt ? 'font-bold' : ''} text-on-surface truncate`}>
                        {n.data?.title || n.type}
                      </p>
                      {n.data?.body && (
                        <p className="text-[11px] text-secondary mt-0.5 line-clamp-2">
                          {n.data.body}
                        </p>
                      )}
                      <p className="text-[10px] text-secondary mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.readAt && (
                      <div className="shrink-0 mt-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </button>
                ))}
                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    className="w-full px-4 py-2 text-xs text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors text-center cursor-pointer"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
