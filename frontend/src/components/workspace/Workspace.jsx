import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from '../board/Board';
import CreateBoardForm from '../board/CreateBoardForm';
import WorkspaceOverview from './WorkspaceOverview';
import AnnouncementList from '../announcements/AnnouncementList';
import { useWorkspace } from '../../context/WorkspaceContext';

const Workspace = () => {
  const navigate = useNavigate();
  const { activeWorkspace, isLoadingWorkspaces, activeView, activeBoard, showCreateBoard, setShowCreateBoard, createBoard } = useWorkspace();

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
        ) : activeView === 'Announcements' ? (
          <AnnouncementList />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-bg-secondary">
            <div className="max-w-md text-center p-8 bg-bg-secondary rounded-2xl shadow-sm border border-border-light">
              <div className="text-6xl mb-6">💬</div>
              <h3 className="text-xl font-bold text-text mb-2">
                Chat for {activeWorkspace.name}
              </h3>
              <p className="text-text-secondary mb-6 text-sm">
                This chat channel is private to the workspace.
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
          onSubmit={async (data) => {
            const res = await createBoard(activeWorkspace.id, data);
            if (!res.success) {
              throw new Error(res.error || 'Failed to create board');
            }
            return res;
          }}
        />
      )}
    </div>
  );
};

export default Workspace;

