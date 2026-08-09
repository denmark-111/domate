import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { supabaseStorageService } from '../../services/supabaseStorageService';
import ConfirmModal from '../common/ConfirmModal';
import WorkspaceIcon from '../workspace/WorkspaceIcon';
import {
  LayoutDashboard,
  Kanban,
  MessageSquare,
  Megaphone,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  Sun,
  Moon,
  Settings,
  LogOut,
  Bell,
  CheckCheck
} from 'lucide-react';

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

const Sidebar = ({ collapsed, onToggle, mobile = false, onCloseMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications, isLoading, hasMore } = useNotifications();

  const {
    activeWorkspace,
    boards,
    setShowCreateBoard,
    deleteBoard
  } = useWorkspace();

  const [showDeleteBoard, setShowDeleteBoard] = useState(false);
  const [deletingBoardId, setDeletingBoardId] = useState(null);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);
  const [deleteBoardError, setDeleteBoardError] = useState(null);

  const [isBoardsOpen, setIsBoardsOpen] = useState(true);
  const [showAllBoards, setShowAllBoards] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [fetchedNotifications, setFetchedNotifications] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openNotifications = () => {
    setDropdownOpen(false);
    setShowNotificationsModal(true);
    if (!fetchedNotifications) {
      fetchNotifications({ page: 1, limit: 20 });
      setFetchedNotifications(true);
    }
  };

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification.id);
    setShowNotificationsModal(false);
    const url = notification.data?.url;
    if (url) {
      navigate(url);
    }
  };

  const handleDeleteBoard = async () => {
    setIsDeletingBoard(true);
    setDeleteBoardError(null);
    try {
      const result = await deleteBoard(deletingBoardId);
      if (result?.success === false) {
        setDeleteBoardError(result.message || 'Failed to delete board.');
      } else {
        setShowDeleteBoard(false);
        setDeletingBoardId(null);
      }
    } catch (err) {
      setDeleteBoardError(err?.message || 'Failed to delete board.');
    } finally {
      setIsDeletingBoard(false);
    }
  };

  if (!activeWorkspace) return null;

  const safeBoards = Array.isArray(boards) ? boards : [];
  const isOverviewActive = location.pathname === `/workspaces/${activeWorkspace.id}`;
  const isAnnouncementsActive = location.pathname === `/workspaces/${activeWorkspace.id}/announcements`;
  const isChatActive = location.pathname === `/workspaces/${activeWorkspace.id}/chat`;
  const isAnyBoardActive = location.pathname.includes(`/workspaces/${activeWorkspace.id}/boards/`);
  const isTeamWorkspace = activeWorkspace.type?.toLowerCase() === 'team';

  const avatarUrl = user?.avatarUrl
    ? supabaseStorageService.getAvatarUrl(user.avatarUrl)
    : null;

  return (
    <aside className={`${mobile ? 'w-72' : collapsed ? 'w-16' : 'w-64'} bg-surface-container-low border-r border-outline-variant flex flex-col h-full shrink-0 transition-[width] duration-200 ease-in-out relative z-20`}>
      
      {/* Desktop Edge Collapse Toggle Button */}
      {!mobile && (
        <button
          onClick={onToggle}
          className="hidden lg:flex absolute -right-3 top-5 z-30 w-6 h-6 rounded-full border border-outline-variant bg-surface-container-lowest text-secondary hover:text-on-surface hover:bg-surface-container-high items-center justify-center shadow-xs cursor-pointer transition-transform hover:scale-110"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}

      {/* Mobile header */}
      {mobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface">
          <span className="font-mono-label text-xs font-bold text-on-surface uppercase">Workspace Menu</span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-secondary hover:text-on-surface rounded-DEFAULT hover:bg-surface-container-high transition-colors"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Top Workspace Header */}
      <div className="px-2 pt-3 pb-2">
        <button
          onClick={() => {
            navigate(`/workspaces/${activeWorkspace.id}`);
            onCloseMobile?.();
          }}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-DEFAULT transition-colors text-left cursor-pointer hover:bg-surface-container-high overflow-hidden"
          title={collapsed ? activeWorkspace.name : undefined}
        >
          <div className="w-8 h-8 rounded-DEFAULT bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-2xs">
            <WorkspaceIcon
              workspace={activeWorkspace}
              containerClassName="w-8 h-8 rounded-DEFAULT shrink-0"
              className="rounded-DEFAULT"
            />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 truncate">
              <h2 className="font-mono-label text-base font-bold text-on-surface truncate leading-snug">
                {activeWorkspace.name}
              </h2>
              <p className="font-body-sm text-xs text-secondary truncate">
                {isTeamWorkspace ? 'Team Workspace' : 'Personal Workspace'}
              </p>
            </div>
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 thin-scrollbar">
        
        {/* Overview Nav Link */}
        <button
          onClick={() => {
            navigate(`/workspaces/${activeWorkspace.id}`);
            onCloseMobile?.();
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-DEFAULT text-xs font-body-sm font-medium transition-colors text-left cursor-pointer overflow-hidden ${
            isOverviewActive
              ? 'bg-primary text-on-primary font-bold shadow-2xs'
              : 'text-secondary hover:text-on-surface hover:bg-surface-container-high'
          }`}
          title={collapsed ? 'Overview' : undefined}
        >
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <LayoutDashboard size={18} />
          </div>
          {!collapsed && <span className="truncate whitespace-nowrap">Overview</span>}
        </button>

        {/* Boards Dropdown Navigation */}
        <div className="my-0.5">
          <button
            onClick={() => {
              if (collapsed) {
                navigate(`/workspaces/${activeWorkspace.id}`);
              } else {
                setIsBoardsOpen(!isBoardsOpen);
              }
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-DEFAULT text-xs font-body-sm font-medium transition-colors text-left cursor-pointer overflow-hidden ${
              isAnyBoardActive && !isOverviewActive && !isChatActive && !isAnnouncementsActive
                ? 'text-on-surface font-bold bg-surface-container-high'
                : 'text-secondary hover:text-on-surface hover:bg-surface-container-high'
            }`}
            title={collapsed ? 'Boards' : undefined}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                <Kanban size={18} />
              </div>
              {!collapsed && <span className="truncate whitespace-nowrap">Boards</span>}
            </div>
            {!collapsed && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="font-mono-label text-[10px] text-secondary font-bold mr-1">
                  {safeBoards.length}
                </span>
                {isBoardsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            )}
          </button>

          {/* Sub-boards List */}
          {!collapsed && isBoardsOpen && (
            <div className="pl-7 pr-1 py-1 flex flex-col gap-0.5">
              {(showAllBoards ? safeBoards : safeBoards.slice(0, 8)).map((board) => {
                const isBoardActive = location.pathname === `/workspaces/${activeWorkspace.id}/boards/${board.id}`;

                return (
                  <div key={board.id} className="group relative">
                    <button
                      onClick={() => {
                        navigate(`/workspaces/${activeWorkspace.id}/boards/${board.id}`);
                        onCloseMobile?.();
                      }}
                      className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-DEFAULT text-xs font-body-sm text-left transition-colors cursor-pointer ${
                        isBoardActive
                          ? 'bg-surface-container-high text-on-surface font-bold border-l-2 border-primary'
                          : 'text-secondary hover:text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-4">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: board.color || 'var(--color-primary)' }}
                        />
                        <span className="truncate">{board.name}</span>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingBoardId(board.id);
                        setShowDeleteBoard(true);
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-secondary hover:text-error hover:bg-error-container rounded-DEFAULT transition-opacity cursor-pointer"
                      title="Delete board"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}

              {safeBoards.length === 0 && (
                <p className="font-body-sm text-[11px] text-secondary py-1 px-2 italic">
                  No boards created
                </p>
              )}

              {safeBoards.length > 8 && (
                <button
                  onClick={() => setShowAllBoards(!showAllBoards)}
                  className="text-left px-2 py-1 font-mono-label text-[10px] text-secondary hover:text-on-surface transition-colors cursor-pointer mt-0.5"
                >
                  {showAllBoards ? 'Show less' : `+ Show more (${safeBoards.length - 8})`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Team Nav Items (Chat & Announcements) */}
        {isTeamWorkspace && (
          <>
            <button
              onClick={() => {
                navigate(`/workspaces/${activeWorkspace.id}/chat`);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-DEFAULT text-xs font-body-sm font-medium transition-colors text-left cursor-pointer overflow-hidden ${
                isChatActive
                  ? 'bg-primary text-on-primary font-bold shadow-2xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-container-high'
              }`}
              title={collapsed ? 'Chat' : undefined}
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                <MessageSquare size={18} />
              </div>
              {!collapsed && <span className="truncate whitespace-nowrap">Chat</span>}
            </button>

            <button
              onClick={() => {
                navigate(`/workspaces/${activeWorkspace.id}/announcements`);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-DEFAULT text-xs font-body-sm font-medium transition-colors text-left cursor-pointer overflow-hidden ${
                isAnnouncementsActive
                  ? 'bg-primary text-on-primary font-bold shadow-2xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-container-high'
              }`}
              title={collapsed ? 'Announcements' : undefined}
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                <Megaphone size={18} />
              </div>
              {!collapsed && <span className="truncate whitespace-nowrap">Announcements</span>}
            </button>
          </>
        )}
      </div>

      {/* Bottom Sidebar Footer Section */}
      <div className="p-2 mt-auto space-y-2">
        {/* New Board Action */}
        <button
          onClick={() => {
            setShowCreateBoard(true);
            onCloseMobile?.();
          }}
          className="w-full bg-primary hover:opacity-90 text-on-primary font-label-caps text-xs font-bold uppercase h-9 flex items-center justify-center gap-2 px-3 rounded-DEFAULT transition-opacity cursor-pointer shadow-2xs overflow-hidden"
          title="New Board"
        >
          <Plus size={16} className="shrink-0" />
          {!collapsed && <span className="truncate whitespace-nowrap">New Board</span>}
        </button>

        {/* Profile Button & Menu */}
        <div className="relative w-full" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-DEFAULT text-xs font-body-sm font-medium transition-colors text-left cursor-pointer overflow-hidden text-secondary hover:text-on-surface hover:bg-surface-container-high"
            title={collapsed ? (user?.fullName || user?.email || 'Profile') : undefined}
          >
            <div className="relative shrink-0">
              <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (user?.fullName || user?.email || 'G').split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
                )}
              </div>
              {collapsed && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center bg-error text-on-error text-[10px] font-bold rounded-full px-1 leading-none border-2 border-surface-container-low pointer-events-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 flex items-center justify-between">
                <span className="font-mono-label text-xs font-bold text-on-surface truncate">
                  {user?.fullName || user?.email?.split('@')[0] || 'User'}
                </span>
                {unreadCount > 0 && (
                  <span className="min-w-[16px] h-[16px] flex items-center justify-center bg-error text-on-error text-[10px] font-bold rounded-full px-1 leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            )}
          </button>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div className={`absolute ${collapsed ? 'left-full bottom-0 ml-2' : 'left-0 bottom-full mb-2'} w-56 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-xl z-50 py-1.5`}>
              <div className="px-4 py-2 border-b border-outline-variant/40">
                <p className="font-mono-label text-xs font-bold text-on-surface truncate">
                  {user?.fullName || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="font-body-sm text-[10px] text-secondary truncate">
                  {user?.email || ''}
                </p>
              </div>

              <div className="py-1">
                {/* Notifications Item */}
                <button
                  onClick={openNotifications}
                  className="w-full flex items-center justify-between px-4 py-2 font-body-sm text-xs text-on-surface hover:bg-surface-container-low transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Bell size={16} className="text-secondary" />
                    <span>Notifications</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-error text-on-error text-[10px] font-bold rounded-full leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Theme Toggle Item */}
                <button
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="w-full flex items-center justify-between px-4 py-2 font-body-sm text-xs text-on-surface hover:bg-surface-container-low transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {theme === 'light' ? <Moon size={16} className="text-secondary" /> : <Sun size={16} className="text-secondary" />}
                    <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                </button>

                {/* Dashboard Item */}
                <button
                  onClick={() => { navigate('/dashboard'); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 font-body-sm text-xs text-on-surface hover:bg-surface-container-low transition-colors text-left cursor-pointer"
                >
                  <LayoutDashboard size={16} className="text-secondary" />
                  <span>Go to Dashboard</span>
                </button>

                {/* Settings Item */}
                <button
                  onClick={() => { navigate('/settings'); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 font-body-sm text-xs text-on-surface hover:bg-surface-container-low transition-colors text-left cursor-pointer"
                >
                  <Settings size={16} className="text-secondary" />
                  <span>Profile Settings</span>
                </button>
              </div>

              <div className="border-t border-outline-variant/40 mx-2 my-1" />

              {/* Logout Item */}
              <button
                onClick={() => { logout(); setDropdownOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2 font-body-sm text-xs text-error hover:bg-error-container transition-colors text-left cursor-pointer"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowNotificationsModal(false)}
        >
          <div
            className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface shrink-0">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-primary" />
                <h3 className="font-mono-label text-sm font-bold text-on-surface">Notifications</h3>
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs text-secondary hover:text-on-surface transition-colors cursor-pointer"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowNotificationsModal(false)}
                  className="p-1 text-secondary hover:text-on-surface rounded-DEFAULT transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
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
                      onClick={() => {
                        const nextPage = Math.floor(notifications.length / 20) + 1;
                        fetchNotifications({ page: nextPage, limit: 20 });
                      }}
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
        </div>
      )}

      {/* Delete Board Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteBoard}
        onClose={() => {
          setShowDeleteBoard(false);
          setDeletingBoardId(null);
          setDeleteBoardError(null);
        }}
        onConfirm={handleDeleteBoard}
        title="Delete Board"
        message={
          deleteBoardError
            ? deleteBoardError
            : 'Are you sure you want to delete this board? All lists and tasks within it will be removed. This action cannot be undone.'
        }
        isLoading={isDeletingBoard}
      />
    </aside>
  );
};

export default Sidebar;
