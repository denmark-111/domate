import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { Home, ListTodo, MessageSquare, Megaphone, Plus, Info, Trash2 } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get shared workspace state from context
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

  const handleWorkspaceChange = (wsId) => {
    navigate(`/workspaces/${wsId}`);
  };

  const isHome = location.pathname === '/dashboard';
  const isTasks = location.pathname === '/tasks';

  return (
    <aside className="w-64 bg-bg-secondary border-r border-border flex flex-col h-screen">
      {/* Home / Logo Section */}
      <div className="p-6 border-b border-border bg-bg">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-lg bg-button flex items-center justify-center text-white font-bold shadow-md group-hover:rotate-12 transition-transform">
            B
          </div>
          <h1 className="text-xl font-bold text-text tracking-tight">Board-Done</h1>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {activeWorkspace ? (
          /* --- WORKSPACE VIEW SIDEBAR --- */
          <>
            <div className="relative px-4 py-4 border-b border-border-light mb-4">
              <button 
                onClick={() => setActiveView('Overview')}
                className={`w-full flex items-center justify-between p-2 rounded-lg shadow-sm border transition-colors group ${
                  activeView === 'Overview' ? 'bg-input-bg border-border text-text-accent' : 'bg-bg border-border'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded bg-label-feature-bg text-label-feature-text flex items-center justify-center text-[10px] font-bold">
                    {activeWorkspace.name[0]}
                  </div>
                  <div className="text-left min-w-0">
                    <h1 className="text-xs font-bold text-text truncate">
                      {activeWorkspace.name}
                    </h1>
                  </div>
                </div>
              </button>
            </div>

            <nav className="px-4 space-y-1">
              
              {activeWorkspace.type?.toLowerCase() === 'team' && (
                <>
                  <button 
                    onClick={() => setActiveView('Announcements')}
                    className={`w-full text-left px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-3 transition-all ${
                      activeView === 'Announcements' ? 'bg-button text-white' : 'text-text-tertiary hover:bg-bg-tertiary/50'
                    }`}
                  >
                    <Megaphone size={20} /> Announcements
                  </button>
                  <button 
                    onClick={() => setActiveView('Chat')}
                    className={`w-full text-left px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-3 transition-all ${
                      activeView === 'Chat' ? 'bg-button text-white' : 'text-text-tertiary hover:bg-bg-tertiary/50'
                    }`}
                  >
                    <MessageSquare size={20} /> Chat
                  </button>
                </>
              )}
            </nav>

            <div className="mt-8 px-4">
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2 px-2 flex justify-between items-center">
                <span>Boards</span>
                <button 
                  onClick={() => setShowCreateBoard(true)}
                  className="text-text-secondary hover:text-text-accent hover:bg-input-bg w-5 h-5 flex items-center justify-center rounded transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="space-y-1">
                {boards.map((board) => (
                  <div key={board.id} className="group relative">
                    <button
                      onClick={() => {
                        setActiveView('Board');
                        setActiveBoard(board);
                      }}
                      className={`w-full text-left px-3 py-2 pr-8 rounded-lg text-sm truncate transition-colors font-medium ${
                        activeView === 'Board' && activeBoard?.id === board.id 
                          ? 'text-text-accent bg-input-bg font-bold' 
                          : 'text-text-secondary hover:bg-bg-tertiary/50 hover:text-button-secondary-text'
                      }`}
                    >
                      # {board.name}
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('Delete this board?')) {
                          await deleteBoard(board.id);
                        }
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                      title="Delete board"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* --- HOME / TASKS VIEW SIDEBAR --- */
          <div className="px-4 space-y-6">
            <nav className="space-y-1 mt-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className={`w-full text-left px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-3 transition-all ${
                  isHome ? 'bg-button text-white' : 'text-text-tertiary hover:bg-bg-tertiary/50'
                }`}
              >
                <Home size={20} /> Home
              </button>
              <button 
                onClick={() => navigate('/tasks')}
                className={`w-full text-left px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-3 transition-all ${
                  isTasks ? 'bg-button text-white' : 'text-text-tertiary hover:bg-bg-tertiary/50'
                }`}
              >
                <ListTodo size={20} /> Tasks
              </button>
            </nav>

            <div>
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-4 px-3 flex justify-between items-center">
                <span>My Workspaces</span>
              </div>
              <div className="space-y-2">
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => handleWorkspaceChange(ws.id)}
                    className="w-full text-left px-3 py-3 rounded-xl border border-transparent bg-bg shadow-sm hover:border-input-border-light hover:shadow-md transition-all flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-input-bg text-text-accent flex items-center justify-center text-xs font-bold">
                      {ws.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text truncate">{ws.name}</p>
                      <p className="text-[10px] text-text-secondary uppercase font-semibold">{ws.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
