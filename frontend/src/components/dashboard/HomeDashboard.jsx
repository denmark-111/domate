import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import { activityService } from '../../services/index.js';
import CreateWorkspaceForm from '../workspace/CreateWorkspaceForm';
import { useAuth } from '../../context/AuthContext';
import { Users } from 'lucide-react';

const HomeDashboard = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user } = useAuth();

  const [recentWorkspaces, setRecentWorkspaces] = useState([]);
  const [recentBoards, setRecentBoards] = useState([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  useEffect(() => {
    const loadRecent = async () => {
      setIsLoadingRecent(true);
      const res = await activityService.getRecent(5);
      if (res.success) {
        setRecentWorkspaces(res.data.recentWorkspaces || []);
        setRecentBoards(res.data.recentBoards || []);
      }
      setIsLoadingRecent(false);
    };
    loadRecent();
  }, []);

  const handleBoardClick = (board) => {
    if (board.workspace?.id) {
      navigate(`/workspaces/${board.workspace.id}`, { state: { selectBoardId: board.id } });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-bg-secondary p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-extrabold text-text mb-2">Welcome back, {user?.fullName || user?.email || 'Guest'}</h1>
          <p className="text-text-secondary">Jump back into a recent workspace or continue where you left off.</p>
        </header>

        {!isLoadingRecent && (
          <>
            {/* Recent Workspaces */}
            <h2 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-4 px-2">Recent Workspaces</h2>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create New Workspace Button */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="group p-6 rounded-2xl border-2 border-dashed border-border hover:border-input-border-focus hover:bg-input-bg transition-all text-left flex flex-col items-center justify-center h-48 gap-3"
              >
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-text-secondary group-hover:border-input-border-focus flex items-center justify-center text-2xl text-text-secondary group-hover:text-text-accent transition-all">
                  +
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-text">Create Workspace</h3>
                  <p className="text-xs text-text-secondary mt-1">Add a new team or personal space</p>
                </div>
              </button>

              {/* Recent Workspace Cards */}
              {recentWorkspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => navigate(`/workspaces/${ws.id}`)}
                  className="group bg-bg-secondary p-6 rounded-2xl border border-border shadow-sm hover:shadow-xl hover:border-input-border-focus transition-all text-left flex flex-col h-48"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-sm group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: ws.color || 'var(--color-button)' }}
                    >
                      {ws.name[0]}
                    </div>
                    {ws.type === 'team' && <Users size={18} className="text-text-secondary" />}
                  </div>

                  <div className="mt-auto">
                    <h3 className="text-lg font-bold text-text group-hover:text-text-accent transition-colors">
                      {ws.name}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      {ws.type === 'team' ? 'Collaborate with your team' : 'Personal workspace'}
                    </p>
                  </div>
                </button>
              ))}
            </section>

            {/* Recent Boards */}
            {recentBoards.length > 0 && (
              <section className="mt-16">
                <h2 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-4 px-2">Recent Boards</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentBoards.map((board) => (
                    <button
                      key={`board-${board.id}`}
                      onClick={() => handleBoardClick(board)}
                      className="p-4 bg-bg rounded-xl border border-border-light shadow-sm flex items-center gap-4 hover:bg-bg-secondary cursor-pointer transition-colors text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl text-white"
                        style={{ backgroundColor: board.color || 'var(--color-bg-tertiary)' }}
                      >
                        {board.name[0]}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-text truncate">{board.name}</h4>
                        <p className="text-xs text-text-secondary truncate">{board.workspace?.name || 'Board'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Create Workspace Modal */}
      {showCreateForm && <CreateWorkspaceForm onClose={() => setShowCreateForm(false)} />}
    </div>
  );
};

export default HomeDashboard;
