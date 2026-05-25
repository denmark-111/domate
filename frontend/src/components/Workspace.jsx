import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from './Board';
import CreateBoardForm from './CreateBoardForm';
import { useWorkspace } from '../context/WorkspaceContext';

const Workspace = () => {
  const navigate = useNavigate();
  const { activeWorkspace, activeView, activeBoard, showCreateBoard, setShowCreateBoard } = useWorkspace();

  // Redirect if workspace not found or still loading
  useEffect(() => {
    if (!activeWorkspace) {
      navigate('/');
    }
  }, [activeWorkspace, navigate]);

  if (!activeWorkspace) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Workspace Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeView === 'Board' ? (
          <Board boardName={activeBoard} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[var(--color-bg-secondary)]">
            <div className="max-w-md text-center p-8 bg-[var(--color-bg-card)] rounded-2xl shadow-sm border border-[var(--color-border-gray-100)]">
              <div className="text-6xl mb-6">{activeView === 'Chat' ? '💬' : '📢'}</div>
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                {activeView} for {activeWorkspace.name}
              </h3>
              <p className="text-[var(--color-text-secondary)] mb-6 text-sm">
                This {activeView.toLowerCase()} channel is private to the workspace.
              </p>
              <div className="inline-block px-4 py-2 bg-[var(--color-bg-blue-50)] text-[var(--color-text-blue-700)] rounded-full text-[10px] font-bold uppercase tracking-wider">
                Coming Soon
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      {showCreateBoard && (
        <CreateBoardForm
          workspaceName={activeWorkspace.name}
          onClose={() => setShowCreateBoard(false)}
          onSubmit={(board) => {
            console.log('Board created:', board);
            // Handle board creation here
            setShowCreateBoard(false);
          }}
        />
      )}
    </div>
  );
};

export default Workspace;

