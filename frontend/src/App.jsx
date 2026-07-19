import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ThemeContextProvider } from './context/ThemeContext';
import { AuthContextProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Landing from './components/auth/Landing';
import Auth from './components/auth/Auth';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import RequireAuth from './components/auth/RequireAuth';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import HomeDashboard from './components/dashboard/HomeDashboard';
import Tasks from './components/dashboard/Tasks';
import Workspace from './components/workspace/Workspace';
import AcceptInvitation from './components/invitation/AcceptInvitation';
import Settings from './components/settings/Settings';

const AppContent = ({ viewType }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') === 'true'
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close mobile sidebar on route/view change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [viewType]);

  const handleToggleSidebar = () => {
    // Mobile: toggle drawer open/close
    // Desktop: toggle collapsed state
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

  return (
    <NotificationProvider>
      <WorkspaceProvider>
        <div className="flex flex-col h-dvh font-sans">
        <Topbar
          collapsed={sidebarCollapsed}
          mobileSidebarOpen={mobileSidebarOpen}
          onToggle={handleToggleSidebar}
          hideSidebarToggle={viewType === 'settings'}
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
          {viewType !== 'settings' && (
            <div className={`hidden lg:flex ${sidebarCollapsed ? 'w-16' : 'w-64'} shrink-0 transition-all duration-200`}>
              <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
            </div>
          )}

          {/* Mobile sidebar drawer */}
          {viewType !== 'settings' && (
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
          )}

          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            {viewType === 'home' && <HomeDashboard />}
            {viewType === 'tasks' && <Tasks />}
            {viewType === 'workspace' && <Workspace />}
            {viewType === 'settings' && <Settings />}
          </main>
        </div>
      </div>
      </WorkspaceProvider>
    </NotificationProvider>
  );
};

function App() {
  return (
    <AuthContextProvider>
      <Router>
        <ThemeContextProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<RequireAuth><AppContent viewType="home" /></RequireAuth>} />
            <Route path="/tasks" element={<RequireAuth><AppContent viewType="tasks" /></RequireAuth>} />
            <Route path="/workspaces/:workspaceId" element={<RequireAuth><AppContent viewType="workspace" /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><AppContent viewType="settings" /></RequireAuth>} />
            <Route path="/invitations/:invitationId" element={<AcceptInvitation />} />
          </Routes>
        </ThemeContextProvider>
      </Router>
    </AuthContextProvider>
  );
}

export default App;