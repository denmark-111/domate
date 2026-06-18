import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from './Board';
import CreateBoardForm from './CreateBoardForm';
import WorkspaceOverview from './WorkspaceOverview';
import { useWorkspace } from '../context/WorkspaceContext';

const Workspace = () => {
  const navigate = useNavigate();
  const { activeWorkspace, isLoadingWorkspaces, activeView, activeBoard, showCreateBoard, setShowCreateBoard } = useWorkspace();

  // Only redirect if workspaces have finished loading and the workspace truly doesn't exist
  useEffect(() => {
    if (!isLoadingWorkspaces && !activeWorkspace) {
      navigate('/dashboard');
    }
  }, [isLoadingWorkspaces, activeWorkspace, navigate]);

  if (isLoadingWorkspaces || !activeWorkspace) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Workspace Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeView === 'Board' ? (
          <Board boardName={activeBoard} />
        ) : activeView === 'Overview' ? (
          <WorkspaceOverview />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-bg-secondary">
            <div className="max-w-md text-center p-8 bg-bg-secondary rounded-2xl shadow-sm border border-border-light">
              <div className="text-6xl mb-6">{activeView === 'Chat' ? '💬' : '📢'}</div>
              <h3 className="text-xl font-bold text-text mb-2">
                {activeView} for {activeWorkspace.name}
              </h3>
              <p className="text-text-secondary mb-6 text-sm">
                This {activeView.toLowerCase()} channel is private to the workspace.
              </p>
              <div className="inline-block px-4 py-2 bg-input-bg text-label-feature-text rounded-full text-[10px] font-bold uppercase tracking-wider">
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

