import { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { Save, Edit3, X, Trash2, UserPlus, XCircle, Users, Image, Trash } from 'lucide-react';
import { workspaceService, invitationService, supabaseStorageService } from '../../services/index.js';
import ConfirmModal from '../common/ConfirmModal';
import InviteMembersForm from './InviteMembersForm';
import ColorPicker from '../common/ColorPicker';
import WorkspaceIcon from './WorkspaceIcon';
import { WORKSPACE_COLORS, BOARD_COLORS } from '../../data/colorPalette';

const WorkspaceOverview = () => {
  const { activeWorkspace, updateWorkspace, deleteWorkspace, updateBoard, deleteBoard, invitations, isLoadingInvitations, createInvitation, revokeInvitation } = useWorkspace();
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', color: '', coverImageUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [removeCover, setRemoveCover] = useState(false);

  const [fullWorkspace, setFullWorkspace] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Fetch full details (which includes memberships) if not fully populated
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

  // Determine if the current user has owner permissions
  const isOwner = displayWorkspace?.memberships?.some(
    (m) => m.role === 'OWNER' && m.user?.id === user?.id
  ) || displayWorkspace?.role === 'OWNER' || displayWorkspace?.type === 'personal'; // Usually personal workspaces are owned by the user

  // Initialize form data when workspace changes or editing starts
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

      // Upload new cover if a file was selected
      if (coverFile) {
        // Delete old cover if it exists
        if (formData.coverImageUrl) {
          supabaseStorageService.deleteWorkspaceCoverUrl(formData.coverImageUrl);
        }
        coverImageUrl = await supabaseStorageService.uploadWorkspaceCoverUrl(displayWorkspace.id, coverFile);
        setCoverFile(null);
        setCoverPreview(null);
      }

      // Remove cover if requested
      if (removeCover) {
        if (formData.coverImageUrl) {
          supabaseStorageService.deleteWorkspaceCoverUrl(formData.coverImageUrl);
        }
        coverImageUrl = null;
        setRemoveCover(false);
      }

      const payload = { name: formData.name, description: formData.description };
      if (formData.color) payload.color = formData.color;
      if (coverImageUrl) payload.coverImageUrl = coverImageUrl;
      else payload.coverImageUrl = null;

      const result = await updateWorkspace(displayWorkspace.id, payload);
      if (result.success) {
        setIsEditing(false);
        setFullWorkspace(result.data);
      } else {
        setError(result.error || 'Failed to update workspace');
      }
    } catch (err) {
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
  const [showDeleteBoard, setShowDeleteBoard] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleDeleteWorkspace = async () => {
    setIsDeletingWorkspace(true);
    // Clean up cover image from storage before deleting
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

  const [editingBoardId, setEditingBoardId] = useState(null);
  const [boardForm, setBoardForm] = useState({ name: '', description: '', color: '' });
  const [boardError, setBoardError] = useState('');
  const [isSavingBoard, setIsSavingBoard] = useState(false);
  const [deletingBoardId, setDeletingBoardId] = useState(null);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);

  const startEditBoard = (board) => {
    setEditingBoardId(board.id);
    setBoardForm({ name: board.name || '', description: board.description || '', color: board.color || '' });
    setBoardError('');
  };

  const handleSaveBoard = async (e) => {
    e.preventDefault();
    if (!boardForm.name.trim()) {
      setBoardError('Board name is required');
      return;
    }
    setIsSavingBoard(true);
    const payload = { name: boardForm.name, description: boardForm.description };
    if (boardForm.color) payload.color = boardForm.color;
    const res = await updateBoard(editingBoardId, payload);
    if (res.success) {
      setFullWorkspace(prev => prev ? ({
        ...prev,
        boards: prev.boards.map(b => b.id === editingBoardId ? { ...b, ...res.data } : b)
      }) : prev);
      setEditingBoardId(null);
      setBoardForm({ name: '', description: '' });
    } else {
      setBoardError(res.error || 'Failed to update board');
    }
    setIsSavingBoard(false);
  };

  const handleDeleteBoard = async (boardId) => {
    setIsDeletingBoard(true);
    setDeletingBoardId(boardId);
    const res = await deleteBoard(boardId);
    if (res.success) {
      setFullWorkspace(prev => prev ? ({
        ...prev,
        boards: prev.boards.filter(b => b.id !== boardId)
      }) : prev);
    }
    setIsDeletingBoard(false);
    setDeletingBoardId(null);
  };

  if (!displayWorkspace) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-bg-secondary p-8 sm:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text">Overview</h1>
          {isOwner && !isEditing && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary hover:bg-bg-tertiary/70 rounded-lg text-sm font-semibold text-text transition-colors"
              >
                <Edit3 size={16} /> Edit
              </button>
              <button
                onClick={() => setShowDeleteWorkspace(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-semibold transition-colors"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}
        </header>

        <div className="rounded-xl border border-border bg-bg p-6 mb-6">
          {!isEditing ? (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <WorkspaceIcon
                  workspace={displayWorkspace}
                  containerClassName="w-12 h-12 rounded-xl"
                  className="rounded-xl"
                />
                <div className="min-w-0">
                  <p className="text-lg font-bold text-text">{displayWorkspace.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {displayWorkspace.type === 'team' ? (
                      <><Users size={12} className="inline mr-0.5" /> Team workspace</>
                    ) : (
                      'Personal workspace'
                    )}
                    {' · '}Created {new Date(displayWorkspace.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {displayWorkspace.description && (
                <div className="pt-4 border-t border-border-light">
                  <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                    {displayWorkspace.description}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-text-secondary mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors"
                  placeholder="Enter workspace name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                  Color
                </label>
                <ColorPicker
                  colors={WORKSPACE_COLORS}
                  selectedColor={formData.color}
                  onChange={(color) => setFormData(prev => ({ ...prev, color }))}
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">
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
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border mb-2">
                    <img
                      src={coverPreview || supabaseStorageService.getCoverImageUrl(formData.coverImageUrl)}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                      title="Remove cover"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="coverImageUrl"
                    className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-border bg-bg-secondary hover:bg-bg-tertiary cursor-pointer transition-colors"
                  >
                    <Image size={24} className="text-text-secondary mb-1" />
                    <span className="text-sm text-text-secondary">Click to upload cover image</span>
                  </label>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-text-secondary mb-1.5">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors resize-none"
                  placeholder="Add a description..."
                />
              </div>

              {error && (
                <div className="p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error-text">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg font-semibold text-text-secondary hover:bg-bg-tertiary transition-colors flex items-center gap-2"
                >
                  <X size={18} /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg font-semibold bg-button hover:bg-button-hover text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Edit Board Section */}
        {editingBoardId && (
          <div className="rounded-xl border border-border bg-bg p-6 mb-6">
            <h3 className="text-sm font-semibold text-text-secondary mb-4">Edit Board</h3>
            <form onSubmit={handleSaveBoard} className="space-y-4">
              <div>
                <label htmlFor="boardName" className="block text-sm font-semibold text-text-secondary mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  id="boardName"
                  name="name"
                  value={boardForm.name}
                  onChange={(e) => setBoardForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors"
                  placeholder="Board name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">
                  Color
                </label>
                <ColorPicker
                  colors={BOARD_COLORS}
                  selectedColor={boardForm.color || BOARD_COLORS[0]}
                  onChange={(color) => setBoardForm(prev => ({ ...prev, color }))}
                />
              </div>
              <div>
                <label htmlFor="boardDesc" className="block text-sm font-semibold text-text-secondary mb-1.5">
                  Description
                </label>
                <textarea
                  id="boardDesc"
                  name="description"
                  value={boardForm.description}
                  onChange={(e) => setBoardForm(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors resize-none"
                  placeholder="Board description"
                />
              </div>
              {boardError && (
                <div className="p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error-text">
                  {boardError}
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setEditingBoardId(null)}
                  disabled={isSavingBoard}
                  className="px-5 py-2 rounded-lg font-semibold text-text-secondary hover:bg-bg-tertiary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBoard}
                  className="px-5 py-2 rounded-lg font-semibold bg-button hover:bg-button-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingBoard ? 'Saving...' : 'Save Board'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Boards List Section */}
        {displayWorkspace.boards && displayWorkspace.boards.length > 0 && (
          <div className="rounded-xl border border-border bg-bg p-6 mb-6">
            <h2 className="text-xs font-semibold text-text-secondary mb-4">Boards</h2>
            <div className="space-y-2">
              {displayWorkspace.boards.map((board) => (
                <div key={board.id} className="flex items-center justify-between px-4 py-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: board.color || 'var(--color-text-tertiary)' }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{board.name}</p>
                      {board.description && (
                        <p className="text-xs text-text-secondary truncate">{board.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEditBoard(board)}
                      className="p-1.5 text-text-secondary hover:text-text-accent hover:bg-bg-tertiary rounded transition-colors"
                      title="Edit board"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingBoardId(board.id);
                        setShowDeleteBoard(true);
                      }}
                      className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Delete board"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={showDeleteBoard}
          onClose={() => {
            setShowDeleteBoard(false);
            setDeletingBoardId(null);
          }}
          onConfirm={() => handleDeleteBoard(deletingBoardId)}
          title="Delete Board"
          message="Are you sure you want to delete this board? All lists and tasks within it will be removed. This action cannot be undone."
          isLoading={isDeletingBoard}
        />

        <ConfirmModal
          isOpen={showDeleteWorkspace}
          onClose={() => setShowDeleteWorkspace(false)}
          onConfirm={handleDeleteWorkspace}
          title="Delete Workspace"
          message="Are you sure you want to delete this workspace? This action cannot be undone."
          confirmLabel="Delete Workspace"
          isLoading={isDeletingWorkspace}
        />

        {/* Team Members Section */}
        <div className="rounded-xl border border-border bg-bg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-text-secondary">
              Members{displayWorkspace.memberships ? ` (${displayWorkspace.memberships.length})` : ''}
            </h2>
            {isOwner && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-button hover:bg-button-hover text-white text-xs font-semibold transition-colors"
              >
                <UserPlus size={14} /> Invite
              </button>
            )}
          </div>
          {isLoadingDetails ? (
            <p className="text-sm text-text-secondary">Loading members...</p>
          ) : displayWorkspace.memberships && displayWorkspace.memberships.length > 0 && displayWorkspace.memberships.some(m => m.user) ? (
            <div className="space-y-2">
              {displayWorkspace.memberships.filter(m => m.user).map((membership) => (
                <div key={membership.user.id} className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-button flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                      {membership.user?.avatarUrl ? (
                        <img src={supabaseStorageService.getAvatarUrl(membership.user.avatarUrl)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (membership.user?.fullName || membership.user?.email || 'U').split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{membership.user?.fullName || 'Unknown User'}</p>
                      <p className="text-xs text-text-secondary truncate">{membership.user?.email || ''}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 ${
                    membership.role === 'OWNER' ? 'bg-label-team-bg text-label-team-text' : 'bg-bg-tertiary text-text-secondary'
                  }`}>
                    {membership.role === 'OWNER' ? 'Owner' : 'Member'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No members found.</p>
          )}

          {/* Pending Invitations (owner only) */}
          {isOwner && (
            <div className="mt-5 pt-5 border-t border-border-light">
              <h4 className="text-xs font-semibold text-text-secondary mb-3">
                Pending Invitations
                {invitations.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-label-feature-bg text-label-feature-text rounded-full text-[10px]">
                    {invitations.length}
                  </span>
                )}
              </h4>
              {isLoadingInvitations ? (
                <p className="text-sm text-text-secondary">Loading invitations...</p>
              ) : invitations.length > 0 ? (
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg hover:bg-bg-tertiary/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 text-xs font-bold">
                          {(inv.email || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text truncate">{inv.email}</p>
                          <p className="text-xs text-text-secondary">
                            Invited {new Date(inv.createdAt).toLocaleDateString()} &middot; expires {new Date(inv.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => revokeInvitation(inv.id, displayWorkspace.id)}
                        className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                        title="Revoke invitation"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No pending invitations.</p>
              )}
            </div>
          )}
        </div>

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
    </div>
  );
};

export default WorkspaceOverview;
