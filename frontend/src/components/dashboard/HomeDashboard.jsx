import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityService } from '../../services/index.js';
import CreateWorkspaceForm from '../workspace/CreateWorkspaceForm';
import WorkspaceIcon from '../workspace/WorkspaceIcon';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus } from 'lucide-react';

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
        <h1 className="text-2xl font-bold text-text mb-10">
          Welcome back, {user?.fullName || user?.email || 'Guest'}
        </h1>

        {!isLoadingRecent && (
          <>
            <section>
              <h2 className="text-xs font-semibold text-text-secondary mb-3">Recent Workspaces</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-dashed border-border text-text-secondary hover:text-text hover:border-text-secondary transition-colors h-32"
                >
                  <Plus size={24} />
                  <span className="text-sm font-medium">New Workspace</span>
                </button>

                {recentWorkspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => navigate(`/workspaces/${ws.id}`)}
                    className="flex flex-col items-start gap-4 p-5 rounded-xl border border-border bg-bg shadow-sm hover:shadow-md transition-shadow text-left h-32"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <WorkspaceIcon
                        workspace={ws}
                        containerClassName="w-10 h-10 rounded-xl"
                        className="rounded-xl"
                      />
                      {ws.type === 'team' && <Users size={16} className="text-text-secondary ml-auto" />}
                    </div>
                    <div className="min-w-0 self-stretch">
                      <p className="text-sm font-semibold text-text truncate">{ws.name}</p>
                      <p className="text-xs text-text-secondary mt-0.5 truncate">
                        {ws.type === 'team' ? 'Team workspace' : 'Personal'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {recentBoards.length > 0 && (
              <section className="mt-10">
                <h2 className="text-xs font-semibold text-text-secondary mb-3">Recent Boards</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recentBoards.map((board) => (
                    <button
                      key={`board-${board.id}`}
                      onClick={() => handleBoardClick(board)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg-tertiary/50 transition-colors text-left"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white font-bold shrink-0"
                        style={{ backgroundColor: board.color || 'var(--color-bg-tertiary)' }}
                      >
                        {board.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate">{board.name}</p>
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

      {showCreateForm && <CreateWorkspaceForm onClose={() => setShowCreateForm(false)} />}
    </div>
  );
};

export default HomeDashboard;
