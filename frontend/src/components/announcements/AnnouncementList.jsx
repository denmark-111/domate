import React, { useState, useEffect, useCallback } from 'react';
import { Megaphone, Plus, Loader, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { announcementService, workspaceService } from '../../services/index.js';
import AnnouncementCard from './AnnouncementCard';
import AnnouncementForm from './AnnouncementForm';
import ConfirmModal from '../common/ConfirmModal';

const AnnouncementList = () => {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Full workspace details (includes memberships) for owner detection
  const [fullWorkspace, setFullWorkspace] = useState(null);

  // Form modal state
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine if current user is an owner of the workspace.
  // The activeWorkspace from context doesn't include memberships (the list endpoint
  // returns only counts), so fetch full details when the workspace changes.
  const isOwner = fullWorkspace?.memberships?.some(
    (m) => m.role === 'OWNER' && m.user?.id === user?.id
  ) || activeWorkspace?.role === 'OWNER' || activeWorkspace?.type === 'personal';

  // Fetch full workspace details (with memberships) for ownership detection
  useEffect(() => {
    const loadWorkspaceDetails = async () => {
      if (activeWorkspace?.id) {
        const res = await workspaceService.getWorkspaceById(activeWorkspace.id);
        if (res.success) {
          setFullWorkspace(res.data);
        }
      }
    };
    loadWorkspaceDetails();
  }, [activeWorkspace?.id]);

  const fetchAnnouncements = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    setIsLoading(true);
    setError('');
    const res = await announcementService.getWorkspaceAnnouncements(activeWorkspace.id);
    if (res.success) {
      setAnnouncements(res.data || []);
    } else {
      setError(res.error || 'Failed to load announcements');
    }
    setIsLoading(false);
  }, [activeWorkspace?.id]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async (data) => {
    const res = await announcementService.createAnnouncement(activeWorkspace.id, data);
    if (!res.success) {
      throw new Error(res.error || 'Failed to create announcement');
    }
    setAnnouncements((prev) => [res.data, ...prev]);
  };

  const handleEdit = async (data) => {
    const res = await announcementService.updateAnnouncement(editingAnnouncement.id, data);
    if (!res.success) {
      throw new Error(res.error || 'Failed to update announcement');
    }
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === editingAnnouncement.id ? { ...a, ...res.data } : a))
    );
  };

  const handleDelete = async () => {
    if (!deletingAnnouncement) return;
    setIsDeleting(true);
    const res = await announcementService.deleteAnnouncement(deletingAnnouncement.id);
    if (res.success) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== deletingAnnouncement.id));
      setShowDeleteConfirm(false);
      setDeletingAnnouncement(null);
    } else {
      setError(res.error || 'Failed to delete announcement');
    }
    setIsDeleting(false);
  };

  const openCreateForm = () => {
    setEditingAnnouncement(null);
    setShowForm(true);
  };

  const openEditForm = (announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const openDeleteConfirm = (announcement) => {
    setDeletingAnnouncement(announcement);
    setShowDeleteConfirm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg">
        <div className="flex items-center gap-3 text-text-secondary">
          <Loader size={24} className="animate-spin" />
          <span className="text-sm font-medium">Loading announcements...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-bg p-8 sm:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-text mb-2 flex items-center gap-3">
              <Megaphone className="text-text-secondary" />
              Announcements
            </h1>
            <p className="text-text-secondary">
              {activeWorkspace?.type === 'personal'
                ? 'Your personal announcements.'
                : 'Team announcements and updates.'}
            </p>
          </div>
          {isOwner && (
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 px-4 py-2.5 bg-button hover:bg-button-hover text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              <Plus size={18} />
              New Announcement
            </button>
          )}
        </header>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-error-bg border border-error-border rounded-xl flex items-center gap-3 text-sm text-error-text">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-error-text/70 hover:text-error-text"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Announcements list */}
        {announcements.length === 0 ? (
          <div className="bg-bg-secondary rounded-2xl border border-border p-12 text-center">
            <div className="text-5xl mb-4">📢</div>
            <h3 className="text-xl font-bold text-text mb-2">No announcements yet</h3>
            <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
              {isOwner
                ? 'Create your first announcement to keep your team informed.'
                : 'Announcements will appear here when they are created.'}
            </p>
            {isOwner && (
              <button
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-button hover:bg-button-hover text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
              >
                <Plus size={18} />
                Create Announcement
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                isOwner={isOwner}
                onEdit={openEditForm}
                onDelete={openDeleteConfirm}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      <AnnouncementForm
        workspaceId={activeWorkspace.id}
        announcement={editingAnnouncement}
        isOpen={showForm}
        onClose={closeForm}
        onSubmit={editingAnnouncement ? handleEdit : handleCreate}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingAnnouncement(null);
        }}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${deletingAnnouncement?.title || 'this announcement'}"? This action cannot be undone.`}
        confirmLabel="Delete Announcement"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AnnouncementList;