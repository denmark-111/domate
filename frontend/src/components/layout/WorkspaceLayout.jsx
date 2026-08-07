import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { WorkspaceProvider, useWorkspace } from '../../context/WorkspaceContext';
import Sidebar from './Sidebar';
import ErrorBoundary from '../common/ErrorBoundary';
import CreateBoardForm from '../board/CreateBoardForm';
import { Menu } from 'lucide-react';

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
      <div className="flex h-dvh font-sans overflow-hidden bg-surface dark:bg-background">
        <div className={`hidden lg:flex ${sidebarCollapsed ? 'w-16' : 'w-64'} shrink-0 h-full`}>
          <div className="w-full h-full bg-surface-container-low border-r border-outline-variant animate-pulse p-4 space-y-4">
            <div className="h-10 bg-surface-container-high rounded-DEFAULT w-full" />
            <div className="h-8 bg-surface-container-high/70 rounded-DEFAULT w-full" />
            <div className="h-8 bg-surface-container-high/70 rounded-DEFAULT w-full" />
          </div>
        </div>
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden p-8 animate-pulse">
          <div className="max-w-[1280px] mx-auto space-y-6 w-full">
            <div className="h-7 bg-surface-container-high rounded-DEFAULT w-32" />
            <div className="rounded-DEFAULT border border-outline-variant bg-surface-container-lowest p-6 space-y-5">
              <div className="h-20 bg-surface-container-high rounded-DEFAULT w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh font-sans overflow-hidden bg-surface dark:bg-background relative">
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={handleCloseMobileSidebar}
        />
      )}

      {/* Mobile Floating Menu Button */}
      <button
        onClick={handleToggleSidebar}
        className="lg:hidden fixed top-3 left-3 z-30 p-2 rounded-DEFAULT bg-surface-container-lowest border border-outline-variant text-on-surface shadow-xs cursor-pointer hover:bg-surface-container-high transition-colors"
        aria-label="Open workspace menu"
      >
        <Menu size={20} />
      </button>

      {/* Desktop sidebar (Spans FULL screen height on left) */}
      <div className={`hidden lg:flex ${sidebarCollapsed ? 'w-16' : 'w-64'} shrink-0 h-full transition-[width] duration-200 ease-in-out relative z-20`}>
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

      {/* Main Workspace Column (Full Height & Width Content Canvas) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
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
