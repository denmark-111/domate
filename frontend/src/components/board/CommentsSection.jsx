import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/taskService.js';
import { supabaseStorageService } from '../../services/index.js';

const formatTimestamp = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getAuthorInitials = (fullName) => {
  if (!fullName) return '?';
  return fullName
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const CommentsSection = ({ taskId, onCommentChange, commentCount = 0, realtimeCommentPayload = null }) => {
  const { user } = useAuth();

  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsPagination, setCommentsPagination] = useState({ page: 1, limit: 50, total: 0, hasMore: false });
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const scrollContainerRef = useRef(null);
  const sentinelRef = useRef(null);

  const fetchComments = useCallback(async (id, page = 1, append = false) => {
    if (!id) return;
    setIsLoadingComments(true);
    const res = await taskService.getComments(id, page);
    if (res.success) {
      const fetched = res.data.data || [];
      setComments((prev) => (append ? [...prev, ...fetched] : fetched));
      setCommentsPagination(res.data.pagination || { page: 1, limit: 50, total: 0, hasMore: false });
    } else {
      if (!append) setComments([]);
    }
    setIsLoadingComments(false);
  }, []);

  // Handle realtime comment updates from other users
  useEffect(() => {
    if (!realtimeCommentPayload || realtimeCommentPayload.taskId !== taskId) return;
    const { action, comment, commentId } = realtimeCommentPayload;
    if (action === 'create' && comment) {
      setComments((prev) => {
        if (prev.some((c) => c.id === comment.id)) {
          return prev;
        }
        setCommentsPagination((p) => ({ ...p, total: p.total + 1 }));
        return [comment, ...prev];
      });
    } else if (action === 'delete' && commentId) {
      setComments((prev) => {
        if (!prev.some((c) => c.id === commentId)) {
          return prev;
        }
        setCommentsPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
        return prev.filter((c) => c.id !== commentId);
      });
    }
  }, [realtimeCommentPayload, taskId]);


  // Reset state and fetch comments when taskId changes
  useEffect(() => {
    if (taskId) {
      setNewComment('');
      setIsAddingComment(false);
      setComments([]);
      setCommentsPagination({ page: 1, limit: 50, total: commentCount, hasMore: false });
      fetchComments(taskId);
    }
  }, [taskId, fetchComments]);



  // Infinite scroll: observe sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container || !commentsPagination.hasMore || isLoadingComments) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && commentsPagination.hasMore && !isLoadingComments) {
          const nextPage = commentsPagination.page + 1;
          fetchComments(taskId, nextPage, true);
        }
      },
      { root: container, rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [commentsPagination, isLoadingComments, taskId, fetchComments]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !taskId) return;
    setIsSubmittingComment(true);
    const res = await taskService.createComment(taskId, newComment.trim());
    if (res.success) {
      const created = res.data;
      setComments((prev) => [created, ...prev]);
      setCommentsPagination((prev) => ({ ...prev, total: prev.total + 1 }));
      setNewComment('');
      setIsAddingComment(false);
    }
    setIsSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId) => {
    setDeletingCommentId(commentId);
    const res = await taskService.deleteComment(commentId);
    if (res.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    }
    setDeletingCommentId(null);
  };


  const displayedCommentCount = isLoadingComments && comments.length === 0
    ? commentCount
    : (commentsPagination.hasMore ? Math.max(comments.length, commentsPagination.total) : comments.length);

  return (
    <div ref={scrollContainerRef} className="sm:w-5/12 shrink-0 flex-1 sm:overflow-y-auto p-4 sm:p-6 space-y-4 sm:thin-scrollbar">
      <h3 className="font-mono-label text-xs uppercase font-bold text-on-surface">
        Comments <span className="text-secondary font-normal">({displayedCommentCount})</span>
      </h3>

      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Add a comment..."
        className="w-full p-3 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest font-body-sm text-xs text-on-surface placeholder:text-outline outline-none focus:border-primary transition-colors resize-none"
        rows="3"
      />
      {(newComment.trim() || isAddingComment) && (
        <div className="flex gap-2">
          <button
            onClick={handleAddComment}
            disabled={isSubmittingComment || !newComment.trim()}
            className="px-4 py-2 bg-primary text-on-primary font-label-caps text-xs font-bold uppercase tracking-wider rounded-DEFAULT hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            {isSubmittingComment ? 'Posting...' : 'Comment'}
          </button>
          <button
            onClick={() => {
              setNewComment('');
              setIsAddingComment(false);
            }}
            className="px-4 py-2 bg-surface-container-lowest text-on-surface border border-outline-variant font-label-caps text-xs font-bold uppercase tracking-wider rounded-DEFAULT hover:border-primary transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {isLoadingComments && comments.length === 0 ? (
        <div className="font-body-sm text-xs text-secondary py-4 text-center">Loading comments...</div>
      ) : (
        <>
          <div className="space-y-3">
            {comments.map((comment) => {
              const authorName = comment.author?.fullName || comment.author?.email || 'Unknown';
              const isOwn = user?.id === comment.authorId;
              const commentAvatarUrl = comment.author?.avatarUrl
                ? supabaseStorageService.getAvatarUrl(comment.author.avatarUrl)
                : null;
              return (
                <div key={comment.id} className="bg-surface-container-low p-3 rounded-DEFAULT border border-outline-variant">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {commentAvatarUrl ? (
                        <img
                          src={commentAvatarUrl}
                          alt={authorName}
                          className="w-6 h-6 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                          {getAuthorInitials(authorName)}
                        </div>
                      )}
                      <span className="font-body-sm text-xs font-bold text-on-surface">{authorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-label text-[10px] text-secondary">
                        {formatTimestamp(comment.createdAt)}
                      </span>
                      {isOwn && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingCommentId === comment.id}
                          className="p-1 text-secondary hover:text-error rounded-DEFAULT transition-colors disabled:opacity-50 cursor-pointer"
                          title="Delete comment"
                        >
                          {deletingCommentId === comment.id ? (
                            <span className="text-xs">...</span>
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="font-body-sm text-xs text-on-surface leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                </div>
              );
            })}
          </div>

          {commentsPagination.hasMore && (
            <div ref={sentinelRef} className="h-4" />
          )}

          {isLoadingComments && comments.length > 0 && (
            <div className="font-body-sm text-xs text-secondary py-2 text-center">Loading more...</div>
          )}
        </>
      )}
    </div>
  );
};

export default CommentsSection;
