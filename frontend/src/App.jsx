import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WorkspaceProvider } from './context/WorkspaceContext';
import Sidebar from './components/Sidebar';
import HomeDashboard from './components/HomeDashboard';
import Tasks from './components/Tasks';
import Workspace from './components/Workspace';

const AppContent = ({ viewType }) => {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen bg-white text-gray-900 font-sans">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden">
          {viewType === 'home' && <HomeDashboard />}
          {viewType === 'tasks' && <Tasks />}
          {viewType === 'workspace' && <Workspace />}
        </main>
      </div>
    </WorkspaceProvider>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent viewType="home" />} />
        <Route path="/tasks" element={<AppContent viewType="tasks" />} />
        <Route path="/workspaces/:workspaceId" element={<AppContent viewType="workspace" />} />
      </Routes>
    </Router>
  );
}

export default App;
