import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import CreateWorkspaceForm from './CreateWorkspaceForm';

const HomeDashboard = () => {
  const { workspaces } = useWorkspace();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-bg-secondary)] p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)] mb-2">Welcome back, John</h1>
          <p className="text-[var(--color-text-secondary)]">Select a workspace to start collaborating or managing your tasks.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => navigate(`/workspaces/${ws.id}`)}
              className="group bg-[var(--color-bg-card)] p-6 rounded-2xl border border-[var(--color-border-primary)] shadow-sm hover:shadow-xl hover:border-[var(--color-border-blue-500)] transition-all text-left flex flex-col h-48"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-blue-button)] flex items-center justify-center text-white text-xl font-bold shadow-sm group-hover:scale-110 transition-transform">
                  {ws.name[0]}
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  ws.type === 'team' ? 'bg-[var(--color-bg-purple-100)] text-[var(--color-text-purple-700)]' : 'bg-[var(--color-bg-green-100)] text-[var(--color-text-green-700)]'
                }`}>
                  {ws.type}
                </span>
              </div>
              
              <div className="mt-auto">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-text-blue-600)] transition-colors">
                  {ws.name}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {ws.type === 'team' ? 'Collaborate with your team' : 'Manage your personal goals'}
                </p>
              </div>
            </button>
          ))}

          {/* Create New Workspace Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="group p-6 rounded-2xl border-2 border-dashed border-[var(--color-border-gray-300)] hover:border-[var(--color-border-blue-500)] hover:bg-[var(--color-bg-blue-50)] transition-all text-left flex flex-col items-center justify-center h-48 gap-3"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-[var(--color-text-secondary)] group-hover:border-[var(--color-border-blue-500)] flex items-center justify-center text-2xl text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-blue-600)] transition-all">
              +
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Create Workspace</h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">Add a new team or personal space</p>
            </div>
          </button>
        </section>

        {/* Recent Activity or Pinned Boards could go here later */}
        <section className="mt-16">
          <h2 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-widest mb-6 px-2">Recent Boards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-gray-100)] shadow-sm flex items-center gap-4 hover:bg-[var(--color-bg-secondary)] cursor-pointer transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-xl text-[var(--color-text-primary)]">#</div>
              <div>
                <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Development</h4>
                <p className="text-xs text-[var(--color-text-secondary)]">Product Team</p>
              </div>
            </div>
            <div className="p-4 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-gray-100)] shadow-sm flex items-center gap-4 hover:bg-[var(--color-bg-secondary)] cursor-pointer transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-xl text-[var(--color-text-primary)]">#</div>
              <div>
                <h4 className="text-sm font-bold text-[var(--color-text-primary)]">Daily Routine</h4>
                <p className="text-xs text-[var(--color-text-secondary)]">Personal Tasks</p>
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
