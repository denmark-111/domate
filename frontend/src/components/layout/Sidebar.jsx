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
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(false);
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
    <>
      <div className={`${collapsed ? 'px-2 pt-2 pb-4' : 'px-3 pt-2 pb-4'} border-b border-border-light mb-4`}>
        <button 
          onClick={() => setActiveView('Overview')}
          className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
            collapsed ? 'justify-center p-2' : 'px-3 py-2'
          } ${
            activeView === 'Overview' 
              ? 'bg-input-bg text-text-accent' 
              : 'text-text-secondary hover:bg-bg-tertiary/50'
          }`}
          title={collapsed ? activeWorkspace.name : undefined}
        >
            <WorkspaceIcon
              workspace={activeWorkspace}
              containerClassName="w-8 h-8 rounded"
              className="rounded"
            />
          {!collapsed && (
            <span className="text-sm font-semibold truncate">
              {activeWorkspace.name}
            </span>
          )}
        </button>
      </div>

      <nav className="px-4 space-y-1">
        
        {activeWorkspace.type?.toLowerCase() === 'team' && (
          <>
            <button 
              onClick={() => setActiveView('Announcements')}
              className={`w-full text-left ${collapsed ? 'px-0 justify-center' : 'px-3'} py-2 rounded-lg font-semibold text-sm flex items-center gap-3 transition-all ${
                activeView === 'Announcements' ? 'bg-button text-white' : 'text-text-tertiary hover:bg-bg-tertiary/50'
              }`}
              title={collapsed ? 'Announcements' : undefined}
            >
              <Megaphone size={20} /> {!collapsed && 'Announcements'}
            </button>
            <button 
              onClick={() => setActiveView('Chat')}
              className={`w-full text-left ${collapsed ? 'px-0 justify-center' : 'px-3'} py-2 rounded-lg font-semibold text-sm flex items-center gap-3 transition-all ${
                activeView === 'Chat' ? 'bg-button text-white' : 'text-text-tertiary hover:bg-bg-tertiary/50'
              }`}
              title={collapsed ? 'Chat' : undefined}
            >
              <MessageSquare size={20} /> {!collapsed && 'Chat'}
            </button>
          </>
        )}
      </nav>

      <div className={`${collapsed ? 'mt-8 px-2' : 'mt-8 px-4'}`}>
        {!collapsed && (
          <div className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-2 flex justify-between items-center">
            <span>Boards</span>
            <button 
              onClick={() => setShowCreateBoard(true)}
              className="text-text-secondary hover:text-text-accent hover:bg-input-bg w-6 h-6 flex items-center justify-center rounded transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
        <div className="space-y-1">
          {(showAllBoards ? boards : boards.slice(0, 10)).map((board) => (
            <div key={board.id} className="group relative">
              <button
                onClick={() => {
                  setActiveView('Board');
                  setActiveBoard(board);
                }}
                className={`w-full text-left ${collapsed ? 'px-0 justify-center' : 'px-3 pr-8'} py-2 rounded-lg text-sm truncate transition-colors font-medium flex items-center ${collapsed ? '' : 'gap-2'} ${
                  activeView === 'Board' && activeBoard?.id === board.id 
                    ? 'text-text-accent bg-input-bg font-bold' 
                    : 'text-text-secondary hover:bg-bg-tertiary/50 hover:text-button-secondary-text'
                }`}
                title={collapsed ? board.name : undefined}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: board.color || 'var(--color-text-tertiary)' }}
                />
                {!collapsed && board.name}
              </button>
              {!collapsed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingBoardId(board.id);
                    setShowDeleteBoard(true);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
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
              className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:text-text-accent transition-colors"
            >
              {showAllBoards ? 'Show less' : `Show more (${boards.length - 10})`}
            </button>
          )}
        </div>
      </div>
    </>
  );

  const renderHomeSidebar = () => (
    <div className="px-4 space-y-6">
        <nav className="space-y-1">
        <button 
          onClick={() => navigate('/dashboard')}
          className={`w-full text-left ${collapsed ? 'px-0 justify-center' : 'px-3'} py-2 rounded-lg font-bold text-sm flex items-center gap-3 transition-all ${
            isHome ? 'bg-button text-white' : 'text-text-tertiary hover:bg-bg-tertiary/50'
          }`}
          title={collapsed ? 'Home' : undefined}
        >
          <Home size={20} /> {!collapsed && 'Home'}
        </button>
        <button 
          onClick={() => navigate('/tasks')}
          className={`w-full text-left ${collapsed ? 'px-0 justify-center' : 'px-3'} py-2 rounded-lg font-bold text-sm flex items-center gap-3 transition-all ${
            isTasks ? 'bg-button text-white' : 'text-text-tertiary hover:bg-bg-tertiary/50'
          }`}
          title={collapsed ? 'Tasks' : undefined}
        >
          <ListTodo size={20} /> {!collapsed && 'Tasks'}
        </button>
      </nav>

      <div>
        {!collapsed && (
          <div className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 px-3 flex justify-between items-center">
            <span>My Workspaces</span>
          </div>
        )}
        <div className="space-y-1">
          {(showAllWorkspaces ? workspaces : workspaces.slice(0, 10)).map(ws => (
            <button
              key={ws.id}
              onClick={() => handleWorkspaceChange(ws.id)}
              className={`w-full py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 ${
                collapsed
                  ? 'justify-center px-0'
                  : 'text-left px-3'
              } text-text-secondary hover:bg-bg-tertiary/50 hover:text-button-secondary-text`}
              title={collapsed ? ws.name : undefined}
            >
              <WorkspaceIcon
                workspace={ws}
                containerClassName="w-6 h-6 rounded"
                className="rounded"
              />
              {!collapsed && <span className="truncate">{ws.name}</span>}
              {!collapsed && ws.type === 'team' && <Users size={12} className="text-text-secondary shrink-0 ml-auto" />}
            </button>
          ))}
          {!collapsed && workspaces.length > 10 && (
            <button
              onClick={() => setShowAllWorkspaces(!showAllWorkspaces)}
              className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:text-text-accent transition-colors"
            >
              {showAllWorkspaces ? 'Show less' : `Show more (${workspaces.length - 10})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <aside className={`${mobile ? 'w-72' : collapsed ? 'w-16' : 'w-64'} bg-bg-secondary border-r border-border flex flex-col h-full shrink-0`}>
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
        {activeWorkspace ? renderWorkspaceSidebar() : renderHomeSidebar()}
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
