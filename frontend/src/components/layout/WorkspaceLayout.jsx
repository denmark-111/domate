import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { WorkspaceProvider, useWorkspace } from '../../context/WorkspaceContext';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import ErrorBoundary from '../common/ErrorBoundary';
import CreateBoardForm from '../board/CreateBoardForm';

const WorkspaceLayoutContent = () => {
  const navigate = useNavigate();
  const { activeWorkspace, isWorkspaceLoading, showCreateBoard, setShowCreateBoard, createBoard } = useWorkspace();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') === 'true'
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isWorkspaceLoading && !activeWorkspace) {
      navigate('/dashboard');
    }
  }, [isWorkspaceLoading, activeWorkspace, navigate]);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setMobileSidebarOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => {
        const next = !prev;
        localStorage.setItem('sidebarCollapsed', next);
        return next;
      });
    }
  };

  const handleCloseMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  if (isWorkspaceLoading || !activeWorkspace) {
    return (
      <div className="flex flex-col h-dvh font-sans">
        <Topbar hideSidebarToggle={true} />
        <div className="flex-1 flex overflow-hidden">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh font-sans">
      <Topbar
        collapsed={sidebarCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        onToggle={handleToggleSidebar}
        hideSidebarToggle={false}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={handleCloseMobileSidebar}
          />
        )}

        {/* Desktop sidebar */}
        <div className={`hidden lg:flex ${sidebarCollapsed ? 'w-16' : 'w-64'} shrink-0 transition-all duration-200`}>
          <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
        </div>

        {/* Mobile sidebar drawer */}
        <div className={`lg:hidden fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <Sidebar
            collapsed={false}
            onToggle={handleToggleSidebar}
            mobile={true}
            onCloseMobile={handleCloseMobileSidebar}
          />
        </div>

        {/* Main workspace content area */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <ErrorBoundary compact title="Failed to load workspace content" message="An unexpected error occurred while loading this workspace view.">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Create Board Modal */}
      {showCreateBoard && activeWorkspace && (
        <CreateBoardForm
          workspaceName={activeWorkspace.name}
          onClose={() => setShowCreateBoard(false)}
          onSubmit={async (data) => {
            const res = await createBoard(activeWorkspace.id, data);
            if (!res.success) {
              throw new Error(res.error || 'Failed to create board');
            }
            if (res.data?.id) {
              navigate(`/workspaces/${activeWorkspace.id}/boards/${res.data.id}`);
            }
            return res;
          }}
        />
      )}
    </div>
  );
};

const WorkspaceLayout = () => {
  return (
    <WorkspaceProvider>
      <WorkspaceLayoutContent />
    </WorkspaceProvider>
  );
};

export default WorkspaceLayout;
