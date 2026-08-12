import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import ConfirmModal from '../common/ConfirmModal';
import Button from '../common/Button';
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
  X
} from 'lucide-react';

const Sidebar = ({ collapsed, onToggle, mobile = false, onCloseMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
            className={`w-full flex items-center justify-between px-3 py-2 rounded-DEFAULT text-xs font-body-sm transition-colors text-left cursor-pointer overflow-hidden ${
              isAnyBoardActive && !isOverviewActive && !isChatActive && !isAnnouncementsActive
                ? 'bg-primary text-on-primary font-bold shadow-2xs'
                : 'text-secondary font-medium hover:text-on-surface hover:bg-surface-container-high'
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
                <span className={`font-mono-label text-[10px] font-bold mr-1 ${
                  isAnyBoardActive && !isOverviewActive && !isChatActive && !isAnnouncementsActive
                    ? 'text-on-primary/80'
                    : 'text-secondary'
                }`}>
                  {safeBoards.length}
                </span>
                {isBoardsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            )}
          </button>

          {/* Sub-boards List */}
          {!collapsed && isBoardsOpen && (
            <div className="py-1 flex flex-col gap-0.5">
              {(showAllBoards ? safeBoards : safeBoards.slice(0, 8)).map((board) => {
                const isBoardActive = location.pathname === `/workspaces/${activeWorkspace.id}/boards/${board.id}`;

                return (
                  <div key={board.id} className="group relative">
                    <button
                      onClick={() => {
                        navigate(`/workspaces/${activeWorkspace.id}/boards/${board.id}`);
                        onCloseMobile?.();
                      }}
                      className={`w-full flex items-center justify-between py-1.5 pl-9 pr-3 rounded-DEFAULT text-xs font-body-sm text-left transition-colors cursor-pointer ${
                        isBoardActive
                          ? 'bg-surface-container-high text-on-surface font-semibold'
                          : 'text-secondary font-medium hover:text-on-surface hover:bg-surface-container-high'
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-secondary hover:text-error hover:bg-error-container rounded-DEFAULT transition-opacity cursor-pointer"
                      title="Delete board"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}

              {safeBoards.length === 0 && (
                <p className="font-body-sm text-[11px] text-secondary py-1 pl-9 pr-3 italic">
                  No boards created
                </p>
              )}

              {safeBoards.length > 8 && (
                <button
                  onClick={() => setShowAllBoards(!showAllBoards)}
                  className="text-left pl-9 pr-3 py-1 font-mono-label text-[10px] text-secondary hover:text-on-surface transition-colors cursor-pointer mt-0.5"
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
        <Button
          onClick={() => {
            setShowCreateBoard(true);
            onCloseMobile?.();
          }}
          className="w-full shadow-2xs overflow-hidden"
          title="New Board"
        >
          <Plus size={16} className="shrink-0" />
          {!collapsed && <span className="truncate whitespace-nowrap">New Board</span>}
        </Button>
      </div>

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
