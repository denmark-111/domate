import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import ConfirmModal from '../common/ConfirmModal';
import WorkspaceIcon from '../workspace/WorkspaceIcon';
import { Home, ListTodo, MessageSquare, Megaphone, Plus, Trash2, Users } from 'lucide-react';

const boardIcon = (board) => ({
  backgroundColor: board.color || 'var(--color-bg-tertiary)'
});

const Sidebar = ({ collapsed, onToggle, mobile = false, onCloseMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    activeWorkspace, 
    workspaces, 
    workspacesPagination,
    fetchWorkspaces,
    isLoadingWorkspaces,
    activeView, 
    setActiveView, 
    boards, 
    activeBoard, 
    setActiveBoard,
    showCreateBoard,
    setShowCreateBoard,
    deleteBoard
  } = useWorkspace();

  const [showDeleteBoard, setShowDeleteBoard] = useState(false);
  const [deletingBoardId, setDeletingBoardId] = useState(null);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);
  const [deleteBoardError, setDeleteBoardError] = useState(null);
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

  const handleWorkspaceChange = (wsId) => {
    navigate(`/workspaces/${wsId}`);
  };

  const isHome = location.pathname === '/dashboard';
  const isTasks = location.pathname === '/tasks';

  const renderWorkspaceSidebar = () => (
    <div className="px-2 space-y-3">
      <div className="pb-2.5 border-b border-border-light">
        <button 
          onClick={() => { setActiveView('Overview'); onCloseMobile?.(); }}
          className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-3 text-left whitespace-nowrap overflow-hidden ${
            activeView === 'Overview' 
              ? 'bg-input-bg text-text-accent font-bold' 
              : 'text-text-secondary hover:bg-bg-tertiary/50 hover:text-button-secondary-text'
          }`}
          title={collapsed ? activeWorkspace.name : undefined}
        >
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <WorkspaceIcon
              workspace={activeWorkspace}
              containerClassName="w-6 h-6 rounded shrink-0"
              className="rounded"
            />
          </div>
          {!collapsed && (
            <span className="truncate">
              {activeWorkspace.name}
            </span>
          )}
        </button>
      </div>

      {activeWorkspace.type?.toLowerCase() === 'team' && (
        <nav className="space-y-0.5">
          <button 
            onClick={() => { setActiveView('Announcements'); onCloseMobile?.(); }}
            className={`w-full px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-3 text-left transition-colors whitespace-nowrap overflow-hidden ${
              activeView === 'Announcements' ? 'bg-button text-white' : 'text-text-tertiary hover:bg-bg-tertiary/50'
            }`}
            title={collapsed ? 'Announcements' : undefined}
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <Megaphone size={20} className="shrink-0" />
            </div>
            {!collapsed && <span className="truncate">Announcements</span>}
          </button>
          <button 
            onClick={() => { setActiveView('Chat'); onCloseMobile?.(); }}
            className={`w-full px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-3 text-left transition-colors whitespace-nowrap overflow-hidden ${
              activeView === 'Chat' ? 'bg-button text-white' : 'text-text-tertiary hover:bg-bg-tertiary/50'
            }`}
            title={collapsed ? 'Chat' : undefined}
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <MessageSquare size={20} className="shrink-0" />
            </div>
            {!collapsed && <span className="truncate">Chat</span>}
          </button>
        </nav>
      )}

      <div>
        {!collapsed && (
          <div className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-3 flex justify-between items-center whitespace-nowrap overflow-hidden">
            <span>Boards</span>
            <button 
              onClick={() => setShowCreateBoard(true)}
              className="text-text-secondary hover:text-text-accent hover:bg-input-bg w-6 h-6 flex items-center justify-center rounded transition-colors shrink-0"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
        <div className="space-y-0.5">
          {(showAllBoards ? boards : boards.slice(0, 10)).map((board) => (
            <div key={board.id} className="group relative">
              <button
                onClick={() => {
                  setActiveView('Board');
                  setActiveBoard(board);
                  onCloseMobile?.();
                }}
                className={`w-full px-3 ${collapsed ? '' : 'pr-8'} py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-3 text-left whitespace-nowrap overflow-hidden ${
                  activeView === 'Board' && activeBoard?.id === board.id 
                    ? 'text-text-accent bg-input-bg font-bold' 
                    : 'text-text-secondary hover:bg-bg-tertiary/50 hover:text-button-secondary-text'
                }`}
                title={collapsed ? board.name : undefined}
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: board.color || 'var(--color-text-tertiary)' }}
                  />
                </div>
                {!collapsed && <span className="truncate">{board.name}</span>}
              </button>
              {!collapsed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingBoardId(board.id);
                    setShowDeleteBoard(true);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Delete board"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          {!collapsed && boards.length > 10 && (
            <button
              onClick={() => setShowAllBoards(!showAllBoards)}
              className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:text-text-accent transition-colors whitespace-nowrap overflow-hidden"
            >
              {showAllBoards ? 'Show less' : `Show more (${boards.length - 10})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderHomeSidebar = () => (
    <div className="px-2 space-y-3">
      <nav className="space-y-0.5">
        <button 
          onClick={() => navigate('/dashboard')}
          className={`w-full px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-3 text-left transition-colors whitespace-nowrap overflow-hidden ${
            isHome ? 'bg-button text-white' : 'text-text-tertiary hover:bg-bg-tertiary/50'
          }`}
          title={collapsed ? 'Home' : undefined}
        >
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <Home size={20} className="shrink-0" />
          </div>
          {!collapsed && <span className="truncate">Home</span>}
        </button>
        <button 
          onClick={() => navigate('/tasks')}
          className={`w-full px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-3 text-left transition-colors whitespace-nowrap overflow-hidden ${
            isTasks ? 'bg-button text-white' : 'text-text-tertiary hover:bg-bg-tertiary/50'
          }`}
          title={collapsed ? 'Tasks' : undefined}
        >
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <ListTodo size={20} className="shrink-0" />
          </div>
          {!collapsed && <span className="truncate">Tasks</span>}
        </button>
      </nav>

      <div>
        {!collapsed && (
          <div className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-3 flex justify-between items-center whitespace-nowrap overflow-hidden">
            <span>My Workspaces</span>
          </div>
        )}
        <div className="space-y-0.5">
          {(() => {
            const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];
            return safeWorkspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => handleWorkspaceChange(ws.id)}
                className="w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-3 text-left text-text-secondary hover:bg-bg-tertiary/50 hover:text-button-secondary-text whitespace-nowrap overflow-hidden"
                title={collapsed ? ws.name : undefined}
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <WorkspaceIcon
                    workspace={ws}
                    containerClassName="w-6 h-6 rounded shrink-0"
                    className="rounded"
                  />
                </div>
                {!collapsed && <span className="truncate">{ws.name}</span>}
                {!collapsed && ws.type === 'team' && <Users size={12} className="text-text-secondary shrink-0 ml-auto" />}
              </button>
            ));
          })()}
          {!collapsed && workspacesPagination?.hasMore && (
            <button
              onClick={() => fetchWorkspaces(workspacesPagination.page + 1)}
              disabled={isLoadingWorkspaces}
              className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:text-text-accent transition-colors whitespace-nowrap overflow-hidden disabled:opacity-50"
            >
              {isLoadingWorkspaces ? 'Loading...' : `Show more (${workspacesPagination.total - workspaces.length})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderWorkspaceSkeleton = () => (
    <div className="px-2 space-y-3 animate-pulse">
      <div className="pb-2.5 border-b border-border-light">
        <div className="w-full px-3 py-2 rounded-lg flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-bg-tertiary shrink-0" />
          {!collapsed && <div className="h-4 bg-bg-tertiary rounded w-32" />}
        </div>
      </div>
      <div>
        {!collapsed && (
          <div className="px-3 mb-2 flex justify-between items-center">
            <div className="h-3 bg-bg-tertiary rounded w-16" />
          </div>
        )}
        <div className="space-y-1.5 px-3">
          <div className="h-7 bg-bg-tertiary/60 rounded w-full" />
          <div className="h-7 bg-bg-tertiary/60 rounded w-full" />
          <div className="h-7 bg-bg-tertiary/60 rounded w-full" />
        </div>
      </div>
    </div>
  );

  const isWorkspaceRoute = location.pathname.startsWith('/workspaces/');

  return (
    <aside className={`${mobile ? 'w-72' : collapsed ? 'w-16' : 'w-64'} bg-bg-secondary border-r border-border flex flex-col h-full shrink-0 transition-[width] duration-200 linear overflow-hidden`}>
      {/* Mobile header with close */}
      {mobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-bold text-text">Menu</span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-text-secondary hover:text-text rounded-lg hover:bg-bg-tertiary transition-colors"
            aria-label="Close sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto py-4">
        {activeWorkspace
          ? renderWorkspaceSidebar()
          : isWorkspaceRoute
          ? renderWorkspaceSkeleton()
          : renderHomeSidebar()}
      </div>

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
