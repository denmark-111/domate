import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Megaphone, Plus, Loader, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { announcementService, workspaceService } from '../../services/index.js';
import AnnouncementCard from './AnnouncementCard';
import AnnouncementForm from './AnnouncementForm';
import ConfirmModal from '../common/ConfirmModal';
import useAnnouncementRealtime from '../../hooks/useAnnouncementRealtime';

const PAGE_SIZE = 20;

const AnnouncementList = () => {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const scrollContainerRef = useRef(null);

  const [fullWorkspace, setFullWorkspace] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner =
    fullWorkspace?.memberships?.some((m) => m.role === 'OWNER' && m.user?.id === user?.id) ||
    activeWorkspace?.role === 'OWNER' ||
    activeWorkspace?.type === 'personal';

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
    const res = await announcementService.getWorkspaceAnnouncements(activeWorkspace.id, { page: 1, limit: PAGE_SIZE });
    if (res.success) {
      const pageData = res.data?.data ?? res.data ?? [];
      setAnnouncements(pageData);
      setHasMore(Boolean(res.data?.pagination?.hasMore));
      setPage(1);
    } else {
      setError(res.error || 'Failed to load announcements');
    }
    setIsLoading(false);
  }, [activeWorkspace?.id]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const loadMore = useCallback(async () => {
    if (!activeWorkspace?.id || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setError('');
    const nextPage = page + 1;
    const res = await announcementService.getWorkspaceAnnouncements(activeWorkspace.id, {
      page: nextPage,
      limit: PAGE_SIZE,
    });
    if (res.success) {
      const pageData = res.data?.data ?? res.data ?? [];
      setAnnouncements((prev) => [...prev, ...pageData]);
      setHasMore(Boolean(res.data?.pagination?.hasMore));
      setPage(nextPage);
    } else {
      setError(res.error || 'Failed to load more announcements');
    }
    setIsLoadingMore(false);
  }, [activeWorkspace?.id, isLoadingMore, hasMore, page]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || isLoadingMore || !hasMore) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 200) {
      loadMore();
    }
  }, [isLoadingMore, hasMore, loadMore]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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

  const handleNewAnnouncementRealtime = useCallback((announcement) => {
    setAnnouncements((prev) => {
      if (prev.some(a => a.id === announcement.id)) return prev;
      return [announcement, ...prev].sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    });
  }, []);

  const handleUpdateAnnouncementRealtime = useCallback((announcement) => {
    setAnnouncements((prev) => {
      const updated = prev.map((a) => (a.id === announcement.id ? { ...a, ...announcement } : a));
      return updated.sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    });
  }, []);

  const handleDeleteAnnouncementRealtime = useCallback((announcementId) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
  }, []);

  useAnnouncementRealtime(
    activeWorkspace?.id,
    handleNewAnnouncementRealtime,
    handleUpdateAnnouncementRealtime,
    handleDeleteAnnouncementRealtime
  );

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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-bg-secondary p-4 sm:p-8 lg:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-6 sm:mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text">Announcements</h1>
          {isOwner && (
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 px-4 py-2 bg-button hover:bg-button-hover text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus size={18} />
              New
            </button>
          )}
        </header>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-3 bg-error-bg border border-error-border rounded-lg flex items-center gap-2 text-sm text-error-text">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-error-text/70 hover:text-error-text font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Announcements list */}
        {announcements.length === 0 ? (
          <div className="rounded-xl border border-border bg-bg p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-bg-secondary flex items-center justify-center mx-auto mb-4">
              <Megaphone size={24} className="text-text-secondary" />
            </div>
            <h3 className="text-base font-semibold text-text mb-1">No announcements yet</h3>
            <p className="text-text-secondary text-sm max-w-md mx-auto">
              {isOwner
                ? 'Create your first announcement to keep your team informed.'
                : 'Announcements will appear here when they are created.'}
            </p>
            {isOwner && (
              <button
                onClick={openCreateForm}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-button hover:bg-button-hover text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <Plus size={16} />
                Create Announcement
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                isOwner={isOwner}
                onEdit={openEditForm}
                onDelete={openDeleteConfirm}
              />
            ))}

            {/* Infinite scroll loading indicator */}
            {hasMore && (
              <div className="flex items-center justify-center py-6">
                {isLoadingMore && (
                  <div className="flex items-center gap-3 text-text-secondary">
                    <Loader size={20} className="animate-spin" />
                    <span className="text-sm font-medium">Loading more...</span>
                  </div>
                )}
              </div>
            )}
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