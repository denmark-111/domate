import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { Info, Save, Edit3, X, Trash2, UserPlus, XCircle } from 'lucide-react';
import { workspaceService, invitationService, supabaseStorageService } from '../../services/index.js';
import ConfirmModal from '../common/ConfirmModal';
import InviteMembersForm from './InviteMembersForm';
import ColorPicker from '../common/ColorPicker';
import { WORKSPACE_COLORS, BOARD_COLORS } from '../../data/colorPalette';

const WorkspaceOverview = () => {
  const { activeWorkspace, updateWorkspace, deleteWorkspace, updateBoard, deleteBoard, invitations, isLoadingInvitations, createInvitation, revokeInvitation } = useWorkspace();
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', color: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
        color: displayWorkspace.color || ''
      });
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
      const payload = { name: formData.name, description: formData.description };
      if (formData.color) payload.color = formData.color;
      const result = await updateWorkspace(displayWorkspace.id, payload);
      if (result.success) {
        setIsEditing(false);
        setFullWorkspace(result.data); // Update local details
      } else {
        setError(result.error || 'Failed to update workspace');
      }
    } catch (err) {
      setError('An error occurred while updating.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showDeleteWorkspace, setShowDeleteWorkspace] = useState(false);
  const [showDeleteBoard, setShowDeleteBoard] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleDeleteWorkspace = async () => {
    setIsDeletingWorkspace(true);
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
    <div className="flex-1 overflow-y-auto bg-bg p-8 sm:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-text mb-2 flex items-center gap-3">
              <Info className="text-text-secondary" />
              Workspace Overview
            </h1>
            <p className="text-text-secondary">View and manage your workspace details.</p>
          </div>
          {isOwner && !isEditing && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg text-sm font-bold text-text transition-colors shadow-sm"
              >
                <Edit3 size={16} /> Edit
              </button>
              <button
                onClick={() => setShowDeleteWorkspace(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-bold text-red-600 transition-colors"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}
        </header>

        <div className="bg-bg-secondary rounded-2xl border border-border p-8 shadow-sm mb-8">
          {!isEditing ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-sm"
                  style={{ backgroundColor: displayWorkspace.color || 'var(--color-button)' }}
                >
                  {displayWorkspace.name[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-1">Workspace Name</h3>
                  <p className="text-xl font-bold text-text">{displayWorkspace.name}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Description</h3>
                <p className="text-text-secondary whitespace-pre-wrap">
                  {displayWorkspace.description || 'No description provided.'}
                </p>
              </div>
              <div className="flex gap-12 pt-4 border-t border-border">
                <div>
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Type</h3>
                  <p className="text-sm font-semibold capitalize text-text">{displayWorkspace.type}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Created</h3>
                  <p className="text-sm font-semibold text-text">
                    {new Date(displayWorkspace.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors"
                  placeholder="Enter workspace name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Color
                </label>
                <ColorPicker
                  colors={WORKSPACE_COLORS}
                  selectedColor={formData.color}
                  onChange={(color) => setFormData(prev => ({ ...prev, color }))}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 rounded-lg border-2 border-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors resize-none"
                  placeholder="Add a description..."
                />
              </div>

              {error && (
                <div className="p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error-text">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-lg font-bold text-text-secondary hover:bg-bg-tertiary transition-colors flex items-center gap-2"
                >
                  <X size={18} /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-lg font-bold bg-button hover:bg-button-hover text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
          <div className="bg-bg-secondary rounded-2xl border border-border p-8 shadow-sm mb-8">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Edit Board</h3>
            <form onSubmit={handleSaveBoard} className="space-y-4">
              <div>
                <label htmlFor="boardName" className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Board Name
                </label>
                <input
                  type="text"
                  id="boardName"
                  name="name"
                  value={boardForm.name}
                  onChange={(e) => setBoardForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border-2 border-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors"
                  placeholder="Board name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Color
                </label>
                <ColorPicker
                  colors={BOARD_COLORS}
                  selectedColor={boardForm.color || BOARD_COLORS[0]}
                  onChange={(color) => setBoardForm(prev => ({ ...prev, color }))}
                />
              </div>
              <div>
                <label htmlFor="boardDesc" className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  id="boardDesc"
                  name="description"
                  value={boardForm.description}
                  onChange={(e) => setBoardForm(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-3 rounded-lg border-2 border-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors resize-none"
                  placeholder="Board description"
                />
              </div>
              {boardError && (
                <div className="p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error-text">
                  {boardError}
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingBoardId(null)}
                  disabled={isSavingBoard}
                  className="px-6 py-2 rounded-lg font-bold text-text-secondary hover:bg-bg-tertiary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBoard}
                  className="px-6 py-2 rounded-lg font-bold bg-button hover:bg-button-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSavingBoard ? 'Saving...' : 'Save Board'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Boards List Section */}
        {displayWorkspace.boards && displayWorkspace.boards.length > 0 && (
          <div className="bg-bg-secondary rounded-2xl border border-border p-8 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Boards</h3>
            </div>
            <div className="space-y-3">
              {displayWorkspace.boards.map((board) => (
                <div key={board.id} className="flex items-center justify-between p-4 bg-bg rounded-lg border border-border-light">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: board.color || 'var(--color-text-tertiary)' }}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-text">{board.name}</h4>
                      <p className="text-xs text-text-secondary">{board.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditBoard(board)}
                      className="p-2 text-text-secondary hover:text-text-accent hover:bg-bg-tertiary rounded transition-colors"
                      title="Edit board"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingBoardId(board.id);
                        setShowDeleteBoard(true);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Delete board"
                    >
                      <Trash2 size={16} />
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
        <div className="bg-bg-secondary rounded-2xl border border-border p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
              Members{displayWorkspace.memberships ? ` (${displayWorkspace.memberships.length})` : ''}
            </h3>
            {isOwner && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-button hover:bg-button-hover text-white text-xs font-bold transition-colors shadow-sm"
              >
                <UserPlus size={14} /> Invite
              </button>
            )}
          </div>
          {isLoadingDetails ? (
            <p className="text-sm text-text-secondary">Loading members...</p>
          ) : displayWorkspace.memberships && displayWorkspace.memberships.length > 0 && displayWorkspace.memberships.some(m => m.user) ? (
            <div className="space-y-3">
              {displayWorkspace.memberships.filter(m => m.user).map((membership) => (
                <div key={membership.user.id} className="flex items-center justify-between p-3 bg-bg rounded-lg border border-border-light">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-button flex items-center justify-center text-white text-xs font-bold shadow-sm overflow-hidden shrink-0">
                      {membership.user?.avatarUrl ? (
                        <img src={supabaseStorageService.getAvatarUrl(membership.user.avatarUrl)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (membership.user?.fullName || membership.user?.email || 'U').split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text">{membership.user?.fullName || 'Unknown User'}</p>
                      <p className="text-xs text-text-secondary">{membership.user?.email || ''}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${
                    membership.role === 'OWNER' ? 'bg-label-team-bg text-label-team-text' : 'bg-bg-tertiary text-text-secondary'
                  }`}>
                    {membership.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No members found.</p>
          )}

          {/* Pending Invitations (owner only) */}
          {isOwner && (
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
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
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-bg rounded-lg border border-border-light">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 text-xs font-bold">
                          {(inv.email || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text">{inv.email}</p>
                          <p className="text-xs text-text-secondary">
                            Invited {new Date(inv.createdAt).toLocaleDateString()} &middot; expires {new Date(inv.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => revokeInvitation(inv.id, displayWorkspace.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
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
