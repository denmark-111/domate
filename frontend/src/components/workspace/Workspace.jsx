import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Board from '../board/Board';
import CreateBoardForm from '../board/CreateBoardForm';
import WorkspaceOverview from './WorkspaceOverview';
import AnnouncementList from '../announcements/AnnouncementList';
import ChatList from '../chat/ChatList';
import { useWorkspace } from '../../context/WorkspaceContext';

const Workspace = () => {
  const navigate = useNavigate();
  const { activeWorkspace, isLoadingWorkspaces, isLoadingActiveWorkspace, activeView, activeBoard, showCreateBoard, setShowCreateBoard, createBoard } = useWorkspace();

  // Only redirect if workspace fetching has finished and the workspace truly doesn't exist
  useEffect(() => {
    if (!isLoadingWorkspaces && !isLoadingActiveWorkspace && !activeWorkspace) {
      navigate('/dashboard');
    }
  }, [isLoadingWorkspaces, isLoadingActiveWorkspace, activeWorkspace, navigate]);

  if (isLoadingWorkspaces || isLoadingActiveWorkspace || !activeWorkspace) {
    return (
      <div className="flex-1 overflow-y-auto bg-bg-secondary p-4 sm:p-8 lg:p-12 animate-pulse">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-7 bg-bg-tertiary rounded w-32" />
          </div>
          <div className="rounded-xl border border-border bg-bg p-4 sm:p-6 space-y-5">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-bg-tertiary shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-bg-tertiary rounded w-48" />
                <div className="h-4 bg-bg-tertiary/70 rounded w-36" />
              </div>
            </div>
            <div className="pt-4 border-t border-border-light space-y-2">
              <div className="h-4 bg-bg-tertiary/60 rounded w-full" />
              <div className="h-4 bg-bg-tertiary/60 rounded w-3/4" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-bg p-4 sm:p-6 space-y-3">
            <div className="h-5 bg-bg-tertiary rounded w-24 mb-4" />
            <div className="h-12 bg-bg-secondary rounded-lg" />
            <div className="h-12 bg-bg-secondary rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

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
        ) : activeView === 'Chat' ? (
          <ChatList />
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

