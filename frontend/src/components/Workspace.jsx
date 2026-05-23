import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from './Board';
import { useWorkspace } from '../context/WorkspaceContext';

const Workspace = () => {
  const navigate = useNavigate();
  // Pull all workspace state from context
  const { activeWorkspace, activeView, activeBoard } = useWorkspace();

  // Redirect if workspace not found or still loading
  useEffect(() => {
    if (!activeWorkspace) {
      navigate('/');
    }
  }, [activeWorkspace, navigate]);

  if (!activeWorkspace) return null;

  return (
    <>
      {/* Header for Workspace View */}
      <header className="h-16 border-b border-gray-200 flex items-center justify-between px-8 bg-white z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Home</span>
          </button>
          <span className="text-gray-300">/</span>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            {activeWorkspace.name}
          </div>
          <span className="text-gray-300">/</span>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            {activeView === 'Board' ? activeBoard : activeView}
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all active:scale-95">
            {activeView === 'Board' ? 'Add Task' : activeView === 'Chat' ? 'New Message' : 'New Announcement'}
          </button>
        </div>
      </header>

      {/* Workspace Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeView === 'Board' ? (
          <Board boardName={activeBoard} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="max-w-md text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="text-6xl mb-6">{activeView === 'Chat' ? '💬' : '📢'}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {activeView} for {activeWorkspace.name}
              </h3>
              <p className="text-gray-500 mb-6 text-sm">
                This {activeView.toLowerCase()} channel is private to the workspace.
              </p>
              <div className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Coming Soon
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Workspace;
