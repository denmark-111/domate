import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ThemeContextProvider } from './context/ThemeContext';
import { AuthContextProvider } from './context/AuthContext';
import Landing from './components/auth/Landing';
import Auth from './components/auth/Auth';
import RequireAuth from './components/auth/RequireAuth';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import HomeDashboard from './components/dashboard/HomeDashboard';
import Tasks from './components/dashboard/Tasks';
import Workspace from './components/workspace/Workspace';
import AcceptInvitation from './components/invitation/AcceptInvitation';

const AppContent = ({ viewType }) => {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen font-sans">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 flex flex-col overflow-hidden">
            {viewType === 'home' && <HomeDashboard />}
            {viewType === 'tasks' && <Tasks />}
            {viewType === 'workspace' && <Workspace />}
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
            <Route path="/dashboard" element={<RequireAuth><AppContent viewType="home" /></RequireAuth>} />
            <Route path="/tasks" element={<RequireAuth><AppContent viewType="tasks" /></RequireAuth>} />
            <Route path="/workspaces/:workspaceId" element={<RequireAuth><AppContent viewType="workspace" /></RequireAuth>} />
            <Route path="/invitations/:token" element={<AcceptInvitation />} />
          </Routes>
        </ThemeContextProvider>
      </Router>
    </AuthContextProvider>
  );
}

export default App;
