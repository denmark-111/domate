import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { Home, ListTodo, MessageSquare, Megaphone, Plus } from 'lucide-react';

const Sidebar = () => {
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
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
    setShowCreateBoard
  } = useWorkspace();

  const handleWorkspaceChange = (wsId) => {
    navigate(`/workspaces/${wsId}`);
    setIsWorkspaceMenuOpen(false);
  };

  const isHome = location.pathname === '/';
  const isTasks = location.pathname === '/tasks';

  return (
    <aside className="w-64 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-primary)] flex flex-col h-screen">
      {/* Home / Logo Section */}
      <div className="p-6 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-blue-button)] flex items-center justify-center text-white font-bold shadow-md group-hover:rotate-12 transition-transform">
            B
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">Board-Done</h1>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {activeWorkspace ? (
          /* --- WORKSPACE VIEW SIDEBAR --- */
          <>
            <div className="relative px-4 py-4 border-b border-[var(--color-border-gray-100)] mb-4">
              <button 
                onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg-primary)] shadow-sm border border-[var(--color-border-primary)] transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded bg-[var(--color-bg-blue-100)] text-[var(--color-text-blue-700)] flex items-center justify-center text-[10px] font-bold">
                    {activeWorkspace.name[0]}
                  </div>
                  <div className="text-left min-w-0">
                    <h1 className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                      {activeWorkspace.name}
                    </h1>
                  </div>
                </div>
                <span className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-tertiary)] transition-colors text-[10px]">▼</span>
              </button>

              {isWorkspaceMenuOpen && (
                <div className="absolute top-full left-4 right-4 mt-1 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg shadow-xl z-50 py-1">
                  <div className="px-3 py-2 text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider border-b border-gray-50 mb-1">Switch Workspace</div>
                  {workspaces.map(ws => (
                    <button
                      key={ws.id}
                      onClick={() => handleWorkspaceChange(ws.id)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--color-bg-blue-50)] transition-colors ${
                        activeWorkspace.id === ws.id ? 'text-[var(--color-text-blue-600)] font-semibold' : 'text-[var(--color-text-gray-700)]'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${activeWorkspace.id === ws.id ? 'bg-[var(--color-bg-blue-button)]' : 'bg-transparent'}`}></div>
                      {ws.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <nav className="px-4 space-y-1">

              
              {activeWorkspace.type === 'team' && (
                <>
                  <button 
                    onClick={() => setActiveView('Announcements')}
                    className={`w-full text-left px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-3 transition-all ${
                      activeView === 'Announcements' ? 'bg-[var(--color-bg-blue-button)] text-white shadow-md shadow-[var(--color-bg-blue-50)]' : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-tertiary)]/50'
                    }`}
                  >
                    <Megaphone size={20} /> Announcements
                  </button>
                  <button 
                    onClick={() => setActiveView('Chat')}
                    className={`w-full text-left px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-3 transition-all ${
                      activeView === 'Chat' ? 'bg-[var(--color-bg-blue-button)] text-white shadow-md shadow-[var(--color-bg-blue-50)]' : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-tertiary)]/50'
                    }`}
                  >
                    <MessageSquare size={20} /> Chat
                  </button>
                </>
              )}
            </nav>

            <div className="mt-8 px-4">
              <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest mb-2 px-2 flex justify-between items-center">
                <span>Boards</span>
                <button 
                  onClick={() => setShowCreateBoard(true)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-blue-600)] hover:bg-[var(--color-bg-blue-50)] w-5 h-5 flex items-center justify-center rounded transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="space-y-1">
                {boards.map((board) => (
                  <button
                    key={board}
                    onClick={() => {
                      setActiveView('Board');
                      setActiveBoard(board);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors font-medium ${
                      activeView === 'Board' && activeBoard === board 
                        ? 'text-[var(--color-text-blue-600)] bg-[var(--color-bg-blue-50)] font-bold' 
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]/50 hover:text-[var(--color-text-gray-700)]'
                    }`}
                  >
                    # {board}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* --- HOME / TASKS VIEW SIDEBAR --- */
          <div className="px-4 space-y-6">
            <nav className="space-y-1 mt-4">
              <button 
                onClick={() => navigate('/')}
                className={`w-full text-left px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-3 transition-all ${
                  isHome ? 'bg-[var(--color-bg-blue-button)] text-white shadow-md shadow-[var(--color-bg-blue-50)]' : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-tertiary)]/50'
                }`}
              >
                <Home size={20} /> Home
              </button>
              <button 
                onClick={() => navigate('/tasks')}
                className={`w-full text-left px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-3 transition-all ${
                  isTasks ? 'bg-[var(--color-bg-blue-button)] text-white shadow-md shadow-[var(--color-bg-blue-50)]' : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-tertiary)]/50'
                }`}
              >
                <ListTodo size={20} /> Tasks
              </button>
            </nav>

            <div>
              <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest mb-4 px-3 flex justify-between items-center">
                <span>My Workspaces</span>
                <button className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-blue-600)]">+</button>
              </div>
              <div className="space-y-2">
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => handleWorkspaceChange(ws.id)}
                    className="w-full text-left px-3 py-3 rounded-xl border border-transparent bg-[var(--color-bg-primary)] shadow-sm hover:border-[var(--color-border-blue-200)] hover:shadow-md transition-all flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-blue-50)] text-[var(--color-text-blue-600)] flex items-center justify-center text-xs font-bold">
                      {ws.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">{ws.name}</p>
                      <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-semibold">{ws.type}</p>
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
