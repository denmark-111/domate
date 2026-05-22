import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';

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
    setActiveBoard 
  } = useWorkspace();

  const handleWorkspaceChange = (wsId) => {
    navigate(`/workspaces/${wsId}`);
    setIsWorkspaceMenuOpen(false);
  };

  const isHome = location.pathname === '/';
  const isTasks = location.pathname === '/tasks';

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      {/* Home / Logo Section */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md group-hover:rotate-12 transition-transform">
            B
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Board-Done</h1>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {activeWorkspace ? (
          /* --- WORKSPACE VIEW SIDEBAR --- */
          <>
            <div className="relative px-4 py-4 border-b border-gray-100 mb-4">
              <button 
                onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-white shadow-sm border border-gray-200 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                    {activeWorkspace.name[0]}
                  </div>
                  <div className="text-left min-w-0">
                    <h1 className="text-xs font-bold text-gray-900 truncate">
                      {activeWorkspace.name}
                    </h1>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-gray-600 transition-colors text-[10px]">▼</span>
              </button>

              {isWorkspaceMenuOpen && (
                <div className="absolute top-full left-4 right-4 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1">
                  <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">Switch Workspace</div>
                  {workspaces.map(ws => (
                    <button
                      key={ws.id}
                      onClick={() => handleWorkspaceChange(ws.id)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-blue-50 transition-colors ${
                        activeWorkspace.id === ws.id ? 'text-blue-600 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${activeWorkspace.id === ws.id ? 'bg-blue-600' : 'bg-transparent'}`}></div>
                      {ws.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <nav className="px-4 space-y-1">
              <button 
                onClick={() => setActiveView('Boards')}
                className={`w-full text-left px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-3 transition-all ${
                  activeView === 'Boards' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-600 hover:bg-gray-200/50'
                }`}
              >
                <span className="text-base">📋</span> Boards
              </button>
              
              {activeWorkspace.type === 'team' && (
                <>
                  <button 
                    onClick={() => setActiveView('Chat')}
                    className={`w-full text-left px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-3 transition-all ${
                      activeView === 'Chat' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-600 hover:bg-gray-200/50'
                    }`}
                  >
                    <span className="text-base">💬</span> Chat
                  </button>
                  <button 
                    onClick={() => setActiveView('Announcements')}
                    className={`w-full text-left px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-3 transition-all ${
                      activeView === 'Announcements' ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-600 hover:bg-gray-200/50'
                    }`}
                  >
                    <span className="text-base">📢</span> Announcements
                  </button>
                </>
              )}
            </nav>

            <div className="mt-8 px-4">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2 flex justify-between items-center">
                <span>Boards</span>
                <button className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 w-5 h-5 flex items-center justify-center rounded transition-colors">+</button>
              </div>
              <div className="space-y-1">
                {boards.map((board) => (
                  <button
                    key={board}
                    onClick={() => {
                      setActiveView('Boards');
                      setActiveBoard(board);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors font-medium ${
                      activeView === 'Boards' && activeBoard === board 
                        ? 'text-blue-600 bg-blue-50/50 font-bold' 
                        : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-700'
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
                  isHome ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-600 hover:bg-gray-200/50'
                }`}
              >
                <span className="text-base">🏠</span> Home
              </button>
              <button 
                onClick={() => navigate('/tasks')}
                className={`w-full text-left px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-3 transition-all ${
                  isTasks ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-600 hover:bg-gray-200/50'
                }`}
              >
                <span className="text-base">✅</span> Tasks
              </button>
            </nav>

            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-3 flex justify-between items-center">
                <span>My Workspaces</span>
                <button className="text-gray-400 hover:text-blue-600">+</button>
              </div>
              <div className="space-y-2">
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => handleWorkspaceChange(ws.id)}
                    className="w-full text-left px-3 py-3 rounded-xl border border-transparent bg-white shadow-sm hover:border-blue-200 hover:shadow-md transition-all flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                      {ws.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{ws.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">{ws.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group text-left">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-white group-hover:scale-110 transition-transform">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">John Doe</p>
            <p className="text-[10px] text-gray-500 truncate font-medium">Settings & Account</p>
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
