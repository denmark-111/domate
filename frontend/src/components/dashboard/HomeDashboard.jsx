import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import { invitationService } from '../../services/index.js';
import CreateWorkspaceForm from '../workspace/CreateWorkspaceForm';
import { useAuth } from '../../context/AuthContext';

const HomeDashboard = () => {
  const { workspaces, fetchMyPendingInvitations } = useWorkspace();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user } = useAuth();

  const [pendingInvites, setPendingInvites] = useState([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoadingInvites(true);
      const res = await invitationService.getMyInvitations();
      if (res.success) {
        setPendingInvites(res.data);
      }
      setIsLoadingInvites(false);
    };
    load();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-bg-secondary p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-extrabold text-text mb-2">Welcome back, {user?.fullName || user?.email || 'Guest'}</h1>
          <p className="text-text-secondary">Select a workspace to start collaborating or managing your tasks.</p>
        </header>

        {/* Pending Invitations Banner */}
        {!isLoadingInvites && pendingInvites.length > 0 && (
          <div className="mb-8 bg-label-feature-bg border border-yellow-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-label-feature-text uppercase tracking-wider">
                Pending Invitations ({pendingInvites.length})
              </h2>
            </div>
            <div className="space-y-3">
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-4 bg-bg rounded-xl border border-border-light">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-button flex items-center justify-center text-white text-sm font-bold">
                      {(inv.workspace?.name || '?')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text">{inv.workspace?.name}</p>
                      <p className="text-xs text-text-secondary">
                        Invited by {inv.invitedBy?.fullName || 'someone'} &middot; {inv.workspace?._count?.memberships || 0} {inv.workspace?._count?.memberships === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/invitations/${inv.id}`)}
                    className="px-4 py-1.5 rounded-lg font-bold bg-button hover:bg-button-hover text-white text-xs transition-colors shadow-sm"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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

          {/* Workspaces */}
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => navigate(`/workspaces/${ws.id}`)}
              className="group bg-bg-secondary p-6 rounded-2xl border border-border shadow-sm hover:shadow-xl hover:border-input-border-focus transition-all text-left flex flex-col h-48"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-button flex items-center justify-center text-white text-xl font-bold shadow-sm group-hover:scale-110 transition-transform">
                  {ws.name[0]}
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  ws.type === 'team' ? 'bg-label-team-bg text-label-team-text' : 'bg-label-personal-bg text-label-personal-text'
                }`}>
                  {ws.type}
                </span>
              </div>

              <div className="mt-auto">
                <h3 className="text-lg font-bold text-text group-hover:text-text-accent transition-colors">
                  {ws.name}
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  {ws.type === 'team' ? 'Collaborate with your team' : 'Manage your personal goals'}
                </p>
              </div>
            </button>
          ))}

        </section>

        {/* Recent Activity or Pinned Boards could go here later */}
        <section className="mt-16">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-6 px-2">Recent Boards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-bg rounded-xl border border-border-light shadow-sm flex items-center gap-4 hover:bg-bg-secondary cursor-pointer transition-colors">
              <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center text-xl text-text">#</div>
              <div>
                <h4 className="text-sm font-bold text-text">Development</h4>
                <p className="text-xs text-text-secondary">Product Team</p>
              </div>
            </div>
            <div className="p-4 bg-bg rounded-xl border border-border-light shadow-sm flex items-center gap-4 hover:bg-bg-secondary cursor-pointer transition-colors">
              <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center text-xl text-text">#</div>
              <div>
                <h4 className="text-sm font-bold text-text">Daily Routine</h4>
                <p className="text-xs text-text-secondary">Personal Tasks</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Create Workspace Modal */}
      {showCreateForm && <CreateWorkspaceForm onClose={() => setShowCreateForm(false)} />}
    </div>
  );
};

export default HomeDashboard;
