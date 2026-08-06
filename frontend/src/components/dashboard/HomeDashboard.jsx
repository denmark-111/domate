import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityService, supabaseStorageService } from '../../services/index.js';
import CreateWorkspaceForm from '../workspace/CreateWorkspaceForm';
import WorkspaceIcon from '../workspace/WorkspaceIcon';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import { Plus, ArrowRight, MoreVertical } from 'lucide-react';

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
      const res = await activityService.getRecent(6);
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

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-surface dark:bg-background">
      <main className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-10 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-on-surface tracking-tight">
              Welcome back, {user?.fullName || user?.email?.split('@')[0] || 'Guest'}
            </h1>
            <p className="font-body-md text-sm sm:text-base text-secondary mt-1">
              Pick up right where you left off and stay on top of your latest work.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="shrink-0 self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>New Workspace</span>
          </Button>
        </div>

        {/* Loading skeleton */}
        {isLoadingRecent && (
          <div className="space-y-8 animate-pulse">
            <div className="h-6 bg-surface-container rounded w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-80 bg-surface-container rounded border border-outline-variant" />
              ))}
            </div>
          </div>
        )}

        {!isLoadingRecent && (
          <>
            {/* Recent Workspaces Cards */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                <h2 className="font-headline-md text-xl font-bold text-on-surface">
                  Recent Workspaces
                </h2>
                <button
                  onClick={() => navigate('/workspaces')}
                  className="font-body-sm text-sm text-secondary hover:text-on-surface transition-colors flex items-center gap-1 font-medium cursor-pointer"
                >
                  <span>View all</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentWorkspaces.map((ws) => (
                  <div
                    key={ws.id}
                    onClick={() => navigate(`/workspaces/${ws.id}`)}
                    className="group bg-surface-container-lowest border border-outline-variant hover:border-primary transition-all duration-200 flex flex-col h-[320px] cursor-pointer rounded-DEFAULT overflow-hidden"
                  >
                    {/* Cover image header */}
                    <div className="h-36 w-full border-b border-outline-variant relative overflow-hidden bg-surface-container-high">
                      {ws.coverImageUrl ? (
                        <img
                          src={supabaseStorageService.getCoverImageUrl(ws.coverImageUrl)}
                          alt={ws.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center relative"
                          style={{ backgroundColor: ws.color || 'var(--color-surface-container-high)' }}
                        >
                          <WorkspaceIcon workspace={ws} containerClassName="w-14 h-14 rounded-md opacity-80" />
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3">
                        <span className="bg-surface-container-lowest border border-outline-variant text-on-surface px-2 py-0.5 rounded-DEFAULT text-[10px] font-label-caps tracking-widest uppercase font-bold">
                          {ws.type === 'team' ? 'TEAM' : 'PERSONAL'}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                      <div>
                        <h3 className="font-headline-md text-base font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                          {ws.name}
                        </h3>
                        <p className="font-body-sm text-xs text-secondary mt-1 line-clamp-2">
                          {ws.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="mt-auto pt-3 flex items-center justify-between border-t border-outline-variant">
                        <div className="flex items-center -space-x-2">
                          {(ws.members || []).slice(0, 3).map((m, i) => (
                            <div
                              key={m.id || i}
                              className="w-6 h-6 rounded-full border border-surface-container-lowest bg-primary text-on-primary flex items-center justify-center text-[9px] font-bold overflow-hidden"
                              title={m.fullName || 'Member'}
                            >
                              {m.avatarUrl ? (
                                <img src={supabaseStorageService.getAvatarUrl(m.avatarUrl)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                getInitials(m.fullName)
                              )}
                            </div>
                          ))}
                          {(ws._count?.memberships ?? 0) > 3 && (
                            <div className="w-6 h-6 rounded-full border border-surface-container-lowest bg-surface-container-high flex items-center justify-center font-label-caps text-[10px] font-bold text-on-surface">
                              +{ws._count.memberships - 3}
                            </div>
                          )}
                        </div>
                        <span className="font-label-caps text-[11px] text-secondary font-medium">
                          Visited {formatTimeAgo(ws.visitedAt || ws.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Boards Section */}
            {recentBoards.length > 0 && (
              <section className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                  <h2 className="font-headline-md text-xl font-bold text-on-surface">
                    Recent Boards
                  </h2>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT divide-y divide-outline-variant overflow-hidden">
                  {recentBoards.map((board) => (
                    <div
                      key={`board-${board.id}`}
                      onClick={() => handleBoardClick(board)}
                      className="flex items-center justify-between p-3.5 hover:bg-surface-container-low transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 w-full max-w-2xl min-w-0">
                        <div
                          className="w-8 h-8 rounded-DEFAULT flex items-center justify-center border border-outline-variant shrink-0 text-white font-bold text-xs"
                          style={{ backgroundColor: board.color || 'var(--color-primary)' }}
                        >
                          {board.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-body-md text-sm font-bold text-on-surface group-hover:underline truncate">
                            {board.name}
                          </h4>
                          <p className="font-body-sm text-xs text-secondary truncate">
                            in {board.workspace?.name || 'Workspace'}
                          </p>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-6 shrink-0">
                        <span className="font-body-sm text-xs text-secondary">
                          Opened {formatTimeAgo(board.visitedAt || board.updatedAt)}
                        </span>
                        <button className="text-secondary hover:text-on-surface transition-colors p-1 rounded hover:bg-surface-container-high opacity-0 group-hover:opacity-100">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {showCreateForm && <CreateWorkspaceForm onClose={() => setShowCreateForm(false)} />}
    </div>
  );
};

export default HomeDashboard;
