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

export default function NotificationBell() {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="p-2 text-text-secondary hover:bg-bg-tertiary rounded-full transition-colors relative"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-error-text text-white text-[10px] font-bold rounded-full px-1 leading-none border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-bg border border-border rounded-lg shadow-xl z-50 max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <h3 className="text-sm font-bold text-text">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-text-secondary hover:text-text transition-colors"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {isLoading && notifications.length === 0 ? (
              <div className="p-6 text-sm text-text-secondary text-center">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-sm text-text-secondary text-center">No notifications</div>
            ) : (
              <>
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-bg-tertiary transition-colors border-b border-border-light last:border-b-0 ${
                      !n.readAt ? 'bg-bg-secondary/50' : ''
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {n.actor?.avatarUrl ? (
                        <img
                          src={n.actor.avatarUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-button flex items-center justify-center text-white text-xs font-bold">
                          {(n.actor?.fullName || '?')[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.readAt ? 'font-bold' : ''} text-text truncate`}>
                        {n.data?.title || n.type}
                      </p>
                      {n.data?.body && (
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                          {n.data.body}
                        </p>
                      )}
                      <p className="text-[11px] text-text-secondary mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.readAt && (
                      <div className="shrink-0 mt-2">
                        <div className="w-2 h-2 rounded-full bg-button" />
                      </div>
                    )}
                  </button>
                ))}
                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    className="w-full px-4 py-2.5 text-xs text-text-secondary hover:text-text hover:bg-bg-tertiary transition-colors text-center"
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
