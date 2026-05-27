import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ThemeContextProvider } from './context/ThemeContext';
import { AuthContextProvider } from './context/AuthContext';
import Landing from './components/Landing';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import HomeDashboard from './components/HomeDashboard';
import Tasks from './components/Tasks';
import Workspace from './components/Workspace';

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
            <Route path="/dashboard" element={<AppContent viewType="home" />} />
            <Route path="/tasks" element={<AppContent viewType="tasks" />} />
            <Route path="/workspaces/:workspaceId" element={<AppContent viewType="workspace" />} />
          </Routes>
        </ThemeContextProvider>
      </Router>
    </AuthContextProvider>
  );
}

export default App;
