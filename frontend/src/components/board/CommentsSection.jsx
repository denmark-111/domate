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

const CommentsSection = ({ taskId, onCommentChange, commentCount = 0 }) => {
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

  // Reset state and fetch comments when taskId changes
  useEffect(() => {
    if (taskId) {
      setNewComment('');
      setIsAddingComment(false);
      if (commentCount > 0) {
        setComments([]);
        setCommentsPagination({ page: 1, limit: 50, total: 0, hasMore: false });
        fetchComments(taskId);
      } else {
        setComments([]);
        setCommentsPagination({ page: 1, limit: 50, total: 0, hasMore: false });
      }
    }
  }, [taskId, fetchComments, commentCount]);

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
      onCommentChange?.(taskId, 1);
    }
    setIsSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId) => {
    setDeletingCommentId(commentId);
    const res = await taskService.deleteComment(commentId);
    if (res.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      onCommentChange?.(taskId, -1);
    }
    setDeletingCommentId(null);
  };

  return (
    <div ref={scrollContainerRef} className="w-1/2 overflow-y-auto p-6 space-y-4 thin-scrollbar">
      <h3 className="text-sm font-semibold text-text">
        Comments <span className="text-text-secondary">({commentsPagination.total})</span>
      </h3>

      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Add a comment..."
        className="w-full px-3 py-2.5 rounded-lg border border-border bg-bg text-sm text-text placeholder-text-secondary outline-none focus:border-input-border-focus transition-colors resize-none"
        rows="3"
      />
      {(newComment.trim() || isAddingComment) && (
        <div className="flex gap-2">
          <button
            onClick={handleAddComment}
            disabled={isSubmittingComment || !newComment.trim()}
            className="px-4 py-2 bg-button hover:bg-button-hover text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
          >
            {isSubmittingComment ? 'Posting...' : 'Comment'}
          </button>
          <button
            onClick={() => {
              setNewComment('');
              setIsAddingComment(false);
            }}
            className="px-4 py-2 bg-button-secondary text-button-secondary-text hover:bg-button-secondary-hover text-sm font-medium rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {isLoadingComments && comments.length === 0 ? (
        <div className="text-sm text-text-secondary py-4 text-center">Loading comments...</div>
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
                <div key={comment.id} className="bg-bg-tertiary p-3 rounded border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {commentAvatarUrl ? (
                        <img
                          src={commentAvatarUrl}
                          alt={authorName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-button text-white text-[10px] font-bold flex items-center justify-center">
                          {getAuthorInitials(authorName)}
                        </div>
                      )}
                      <span className="text-sm font-medium text-text">{authorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">
                        {formatTimestamp(comment.createdAt)}
                      </span>
                      {isOwn && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingCommentId === comment.id}
                          className="p-1 text-text-secondary hover:text-red-500 rounded transition-colors disabled:opacity-50"
                          title="Delete comment"
                        >
                          {deletingCommentId === comment.id ? (
                            <span className="text-xs">...</span>
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                </div>
              );
            })}
          </div>

          {commentsPagination.hasMore && (
            <div ref={sentinelRef} className="h-4" />
          )}

          {isLoadingComments && comments.length > 0 && (
            <div className="text-sm text-text-secondary py-2 text-center">Loading more...</div>
          )}
        </>
      )}
    </div>
  );
};

export default CommentsSection;
