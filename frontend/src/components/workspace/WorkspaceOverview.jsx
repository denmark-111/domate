import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { Edit3, Trash2, UserPlus, XCircle, MoreVertical, Image, Trash, Plus, Search, LayoutDashboard, Calendar, Layers } from 'lucide-react';
import { workspaceService, supabaseStorageService } from '../../services/index.js';
import ConfirmModal from '../common/ConfirmModal';
import InviteMembersForm from './InviteMembersForm';
import ColorPicker from '../common/ColorPicker';
import WorkspaceIcon from './WorkspaceIcon';
import Button from '../common/Button';
import { WORKSPACE_COLORS } from '../../data/colorPalette';

const WorkspaceOverview = () => {
  const navigate = useNavigate();
  const { 
    activeWorkspace, 
    updateWorkspace, 
    deleteWorkspace, 
    invitations, 
    createInvitation, 
    revokeInvitation,
    boards,
    setShowCreateBoard
  } = useWorkspace();
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', color: '', coverImageUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [showDropdown, setShowDropdown] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [removeCover, setRemoveCover] = useState(false);

  const [fullWorkspace, setFullWorkspace] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [boardSearchQuery, setBoardSearchQuery] = useState('');

  useEffect(() => {
    const loadDetails = async () => {
      if (activeWorkspace?.id) {
        setIsLoadingDetails(true);
        const res = await workspaceService.getWorkspaceById(activeWorkspace.id);
        if (res.success) {
          setFullWorkspace(res.data);
        }
        setIsLoadingDetails(false);
      }
    };
    loadDetails();
  }, [activeWorkspace?.id]);

  const displayWorkspace = fullWorkspace || activeWorkspace;

  const isOwner = displayWorkspace?.memberships?.some(
    (m) => m.role === 'OWNER' && m.user?.id === user?.id
  ) || displayWorkspace?.type === 'personal';

  useEffect(() => {
    if (displayWorkspace) {
      setFormData({
        name: displayWorkspace.name || '',
        description: displayWorkspace.description || '',
        color: displayWorkspace.color || '',
        coverImageUrl: displayWorkspace.coverImageUrl || ''
      });
      setCoverFile(null);
      setCoverPreview(null);
      setRemoveCover(false);
    }
  }, [displayWorkspace, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Workspace name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      let coverImageUrl = formData.coverImageUrl;

      if (coverFile) {
        if (formData.coverImageUrl) {
          supabaseStorageService.deleteWorkspaceCoverUrl(formData.coverImageUrl);
        }
        coverImageUrl = await supabaseStorageService.uploadWorkspaceCoverUrl(displayWorkspace.id, coverFile);
        setCoverFile(null);
        setCoverPreview(null);
      }

      if (removeCover) {
        if (formData.coverImageUrl) {
          supabaseStorageService.deleteWorkspaceCoverUrl(formData.coverImageUrl);
        }
        coverImageUrl = null;
        setRemoveCover(false);
      }

      const payload = { name: formData.name, description: formData.description };
      if (formData.color) payload.color = formData.color;
      payload.coverImageUrl = coverImageUrl || null;

      const result = await updateWorkspace(displayWorkspace.id, payload);
      if (result.success) {
        setIsEditing(false);
        setFullWorkspace(result.data);
      } else {
        setError(result.error || 'Failed to update workspace');
      }
    } catch {
      setError('An error occurred while updating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setRemoveCover(false);
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    setRemoveCover(true);
  };

  const [showDeleteWorkspace, setShowDeleteWorkspace] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleDeleteWorkspace = async () => {
    setIsDeletingWorkspace(true);
    if (displayWorkspace.coverImageUrl) {
      supabaseStorageService.deleteWorkspaceCoverUrl(displayWorkspace.coverImageUrl);
    }
    const result = await deleteWorkspace(displayWorkspace.id);
    if (result.success) {
      window.location.href = '/dashboard';
    } else {
      setError(result.error || 'Failed to delete workspace');
    }
    setIsDeletingWorkspace(false);
    setShowDeleteWorkspace(false);
  };

  if (!displayWorkspace) return null;

  const membersList = displayWorkspace.memberships?.filter(m => m.user) || [];
  const safeBoards = Array.isArray(boards) ? boards : [];
  const filteredBoards = safeBoards.filter(b => 
    !boardSearchQuery || b.name.toLowerCase().includes(boardSearchQuery.toLowerCase())
  );

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-surface dark:bg-background">
      <main className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 pt-3 pb-8 md:pt-4 md:pb-10 flex flex-col gap-6">
        
        {/* Cover Header Banner */}
        <div className="w-full h-48 md:h-64 rounded-DEFAULT bg-surface-container-high overflow-hidden border border-outline-variant relative">
          {displayWorkspace.coverImageUrl ? (
            <img
              src={supabaseStorageService.getCoverImageUrl(displayWorkspace.coverImageUrl)}
              alt={displayWorkspace.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: displayWorkspace.color || 'var(--color-surface-container-high)' }}
            >
              <WorkspaceIcon workspace={displayWorkspace} containerClassName="w-20 h-20 rounded-lg opacity-80" />
            </div>
          )}
        </div>

        {/* Hero Title & Actions Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="max-w-3xl flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-on-surface tracking-tight">
                {displayWorkspace.name}
              </h1>
              {isOwner && !isEditing && (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-1.5 text-secondary hover:text-on-surface hover:bg-surface-container-low rounded-DEFAULT transition-colors"
                    title="Workspace options"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {showDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                      <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1 w-48 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-xl z-50 py-1">
                        <button
                          onClick={() => { setIsEditing(true); setShowDropdown(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
                        >
                          <Edit3 size={16} className="text-secondary" /> Edit workspace
                        </button>
                        <div className="border-t border-outline-variant mx-2" />
                        <button
                          onClick={() => { setShowDeleteWorkspace(true); setShowDropdown(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-container transition-colors text-left"
                        >
                          <Trash2 size={16} /> Delete workspace
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <p className="font-body-md text-sm sm:text-base text-secondary mt-2 leading-relaxed">
              {displayWorkspace.description || 'No description provided for this workspace.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isOwner && (
              <Button
                variant="secondary"
                onClick={() => setShowInviteModal(true)}
                className="shrink-0"
              >
                <UserPlus size={16} />
                <span>Invite Member</span>
              </Button>
            )}
            <Button
              onClick={() => setShowCreateBoard(true)}
              className="shrink-0"
            >
              <Plus size={16} />
              <span>New Board</span>
            </Button>
          </div>
        </div>

        {/* Edit Form Section */}
        {isEditing && (
          <section className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-6 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="font-headline-md text-lg font-bold text-on-surface">Edit Workspace</h2>

              <div>
                <label htmlFor="name" className="block font-mono-label text-xs uppercase font-bold text-on-surface mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-DEFAULT font-body-md text-sm text-on-surface outline-none transition-colors"
                  placeholder="Enter workspace name"
                />
              </div>

              <div>
                <label className="block font-mono-label text-xs uppercase font-bold text-on-surface mb-1.5">
                  Color Accent
                </label>
                <ColorPicker
                  colors={WORKSPACE_COLORS}
                  selectedColor={formData.color}
                  onChange={(color) => setFormData(prev => ({ ...prev, color }))}
                />
              </div>

              <div>
                <label className="block font-mono-label text-xs uppercase font-bold text-on-surface mb-1.5">
                  Cover Image
                </label>
                <input
                  type="file"
                  id="coverImageUrl"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                />
                {(coverPreview || (formData.coverImageUrl && !removeCover)) ? (
                  <div className="relative w-full max-w-64 aspect-video rounded-DEFAULT overflow-hidden border border-outline-variant mb-2">
                    <img
                      src={coverPreview || supabaseStorageService.getCoverImageUrl(formData.coverImageUrl)}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                      title="Remove cover"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="coverImageUrl"
                    className="flex flex-col items-center justify-center w-full max-w-64 aspect-video rounded-DEFAULT border-2 border-dashed border-outline-variant bg-surface-container-low hover:bg-surface-container-high cursor-pointer transition-colors"
                  >
                    <Image size={24} className="text-secondary mb-1" />
                    <span className="font-body-sm text-xs text-secondary">Upload cover image</span>
                  </label>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block font-mono-label text-xs uppercase font-bold text-on-surface mb-1.5">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full p-3 bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-DEFAULT font-body-md text-sm text-on-surface outline-none resize-none transition-colors"
                  placeholder="Add a workspace description..."
                />
              </div>

              {error && (
                <div className="p-3 bg-error-container border border-error rounded-DEFAULT text-xs text-on-error-container font-medium">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-DEFAULT font-label-caps text-xs font-bold uppercase text-secondary hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </section>
        )}

        {/* Grid Section: Metrics & Members */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content (Metrics & Members) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-label-caps text-xs text-secondary font-bold uppercase tracking-wider">Total Boards</span>
                  <LayoutDashboard className="text-outline" size={20} />
                </div>
                <div>
                  <span className="font-display text-4xl sm:text-5xl font-semibold text-on-surface block">
                    {safeBoards.length}
                  </span>
                  <span className="font-body-sm text-xs text-secondary mt-1 block">
                    Active boards in workspace
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-label-caps text-xs text-secondary font-bold uppercase tracking-wider">Workspace Type</span>
                  <Layers className="text-outline" size={20} />
                </div>
                <div>
                  <span className="font-display text-2xl sm:text-3xl font-semibold text-on-surface block uppercase">
                    {displayWorkspace.type || 'TEAM'}
                  </span>
                  <span className="font-body-sm text-xs text-secondary mt-1 block">
                    Created {new Date(displayWorkspace.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Team Members Section */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                <div>
                  <h3 className="font-headline-md text-lg font-bold text-on-surface">Team Members</h3>
                  <p className="font-body-sm text-xs text-secondary mt-0.5">
                    {membersList.length} Active contributor{membersList.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-3 py-1.5 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant rounded-DEFAULT text-on-surface font-label-caps text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserPlus size={14} />
                    <span>Invite</span>
                  </button>
                )}
              </div>

              {isLoadingDetails ? (
                <p className="font-body-sm text-xs text-secondary py-4">Loading members...</p>
              ) : membersList.length > 0 ? (
                <ul className="divide-y divide-outline-variant">
                  {membersList.map((membership) => (
                    <li key={membership.user.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                          {membership.user?.avatarUrl ? (
                            <img src={supabaseStorageService.getAvatarUrl(membership.user.avatarUrl)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(membership.user?.fullName)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-body-md text-sm font-semibold text-on-surface truncate">
                            {membership.user?.fullName || 'Unknown User'}
                          </p>
                          <p className="font-body-sm text-xs text-secondary truncate">
                            {membership.user?.email || ''}
                          </p>
                        </div>
                      </div>
                      <span className="font-label-caps text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-container-high text-on-surface border border-outline-variant shrink-0 ml-2">
                        {membership.role === 'OWNER' ? 'Owner' : 'Member'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-body-sm text-xs text-secondary py-4">No members found.</p>
              )}

              {/* Pending Invitations Section */}
              {isOwner && invitations.length > 0 && (
                <div className="pt-4 border-t border-outline-variant space-y-3">
                  <h4 className="font-label-caps text-xs text-secondary uppercase font-bold tracking-wider">
                    Pending Invitations ({invitations.length})
                  </h4>
                  <div className="space-y-2">
                    {invitations.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-DEFAULT border border-outline-variant">
                        <div className="min-w-0">
                          <p className="font-body-sm text-xs font-semibold text-on-surface truncate">{inv.email}</p>
                          <p className="font-body-sm text-[10px] text-secondary">
                            Invited {new Date(inv.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => revokeInvitation(inv.id, displayWorkspace.id)}
                          className="p-1 text-secondary hover:text-error rounded transition-colors"
                          title="Revoke invitation"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar Column (Active Boards Quick List) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                <h3 className="font-headline-md text-base font-bold text-on-surface">Active Boards</h3>
                <span className="font-mono-label text-xs text-secondary font-bold">{safeBoards.length}</span>
              </div>

              {/* Filter input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary" size={14} />
                <input
                  type="text"
                  placeholder="Filter boards..."
                  value={boardSearchQuery}
                  onChange={(e) => setBoardSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-DEFAULT font-body-sm text-xs text-on-surface outline-none transition-colors"
                />
              </div>

              {/* Board Items */}
              {filteredBoards.length === 0 ? (
                <p className="font-body-sm text-xs text-secondary py-4 text-center">
                  {boardSearchQuery ? 'No boards match your filter.' : 'No boards created yet.'}
                </p>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto thin-scrollbar pr-1">
                  {filteredBoards.map((board) => (
                    <div
                      key={board.id}
                      onClick={() => navigate(`/workspaces/${displayWorkspace.id}/boards/${board.id}`)}
                      className="p-3 bg-surface-container-lowest border border-outline-variant hover:border-primary rounded-DEFAULT transition-all duration-200 cursor-pointer group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-7 h-7 rounded-DEFAULT flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: board.color || 'var(--color-primary)' }}
                        >
                          {board.name[0]}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-body-md text-xs font-bold text-on-surface group-hover:underline truncate">
                            {board.name}
                          </h4>
                          <span className="font-mono-label text-[10px] text-secondary flex items-center gap-1 mt-0.5">
                            <Calendar size={10} />
                            <span>{new Date(board.updatedAt || board.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      <ConfirmModal
        isOpen={showDeleteWorkspace}
        onClose={() => setShowDeleteWorkspace(false)}
        onConfirm={handleDeleteWorkspace}
        title="Delete Workspace"
        message="Are you sure you want to delete this workspace? All boards, tasks, chat, and announcements will be removed permanently. This action cannot be undone."
        confirmLabel="Delete Workspace"
        isLoading={isDeletingWorkspace}
      />

      {/* Invite Members Modal */}
      {showInviteModal && (
        <InviteMembersForm
          workspaceName={displayWorkspace.name}
          onClose={() => setShowInviteModal(false)}
          onSubmit={async (emails) => {
            return createInvitation(displayWorkspace.id, emails);
          }}
        />
      )}
    </div>
  );
};

export default WorkspaceOverview;
