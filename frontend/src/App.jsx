import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ThemeContextProvider } from './context/ThemeContext';
import { AuthContextProvider } from './context/AuthContext';
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

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', next);
      return next;
    });
  };

  return (
    <WorkspaceProvider>
      <div className="flex flex-col h-screen font-sans">
        <Topbar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />

        <div className="flex flex-1 overflow-hidden">
          {viewType !== 'settings' && <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />}
          <main className="flex-1 flex flex-col overflow-hidden">
            {viewType === 'home' && <HomeDashboard />}
            {viewType === 'tasks' && <Tasks />}
            {viewType === 'workspace' && <Workspace />}
            {viewType === 'settings' && <Settings />}
          </main>
        </div>
      </div>
    </WorkspaceProvider>
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
