import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import HomeDashboard from './components/HomeDashboard';
import Tasks from './components/Tasks';

const AppContent = ({ viewType }) => {
  const workspaces = [
    { id: 'w1', name: 'Product Team', type: 'team' },
    { id: 'w2', name: 'Personal Tasks', type: 'personal' }
  ];

  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [activeView, setActiveView] = useState('Boards');
  const [activeBoard, setActiveBoard] = useState(null);

  // Sync state with URL
  useEffect(() => {
    if (viewType === 'workspace' && workspaceId) {
      const ws = workspaces.find(w => w.id === workspaceId);
      if (ws) {
        setActiveWorkspace(ws);
        // If we just entered a workspace from Home/Tasks, default to Boards
        if (activeView === 'Home' || activeView === 'Tasks' || !activeView) {
          setActiveView('Boards');
        }
        if (!activeBoard) {
          setActiveBoard(ws.id === 'w1' ? 'Development' : 'Daily Routine');
        }
      } else {
        navigate('/');
      }
    } else {
      setActiveWorkspace(null);
      setActiveBoard(null);
      setActiveView(viewType === 'tasks' ? 'Tasks' : 'Home');
    }
  }, [workspaceId, viewType]); // Removed activeBoard/activeView from deps to prevent state reset loops

  const boards = activeWorkspace 
    ? (activeWorkspace.id === 'w1' 
        ? ['Development', 'Marketing', 'Product Roadmap'] 
        : ['Daily Routine', 'Reading List', 'House Projects'])
    : [];

  const handleWorkspaceSelect = (id) => {
    navigate(`/${id}`);
  };

  const goToHome = () => {
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans">
      <Sidebar 
        activeWorkspace={activeWorkspace}
        workspaces={workspaces}
        activeView={activeView} 
        setActiveView={setActiveView} 
        boards={boards} 
        activeBoard={activeBoard}
        setActiveBoard={setActiveBoard}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {viewType === 'home' && (
          <HomeDashboard 
            workspaces={workspaces} 
            onSelectWorkspace={handleWorkspaceSelect} 
          />
        )}

        {viewType === 'tasks' && (
          <Tasks goToHome={goToHome} />
        )}

        {viewType === 'workspace' && activeWorkspace && (
          <>
            <header className="h-16 border-b border-gray-200 flex items-center justify-between px-8 bg-white z-10 shrink-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={goToHome}
                  className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm transition-colors group"
                >
                  <span className="group-hover:-translate-x-1 transition-transform">←</span>
                  <span>Home</span>
                </button>
                <span className="text-gray-300">/</span>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  {activeWorkspace.name}
                </div>
                <span className="text-gray-300">/</span>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                  {activeView === 'Boards' ? activeBoard : activeView}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all active:scale-95">
                  {activeView === 'Boards' ? 'Add Task' : activeView === 'Chat' ? 'New Message' : 'New Announcement'}
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeView === 'Boards' ? (
                <KanbanBoard boardName={activeBoard} />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="max-w-md text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-6xl mb-6">{activeView === 'Chat' ? '💬' : '📢'}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{activeView} for {activeWorkspace.name}</h3>
                    <p className="text-gray-500 mb-6 text-sm">This {activeView.toLowerCase()} channel is private to the workspace.</p>
                    <div className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Coming Soon</div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent viewType="home" />} />
        <Route path="/tasks" element={<AppContent viewType="tasks" />} />
        <Route path="/:workspaceId" element={<AppContent viewType="workspace" />} />
      </Routes>
    </Router>
  );
}

export default App;
