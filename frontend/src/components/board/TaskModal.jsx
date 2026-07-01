import React, { useState, useEffect, useCallback } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/taskService.js';

const TaskModal = ({ task, isOpen, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Inline editable fields
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Comment state
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsPagination, setCommentsPagination] = useState({ page: 1, limit: 50, total: 0, hasMore: false });
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const fetchComments = useCallback(async (taskId, page = 1, append = false) => {
    if (!taskId) return;
    setIsLoadingComments(true);
    const res = await taskService.getComments(taskId, page);
    if (res.success) {
      const fetched = res.data.data || [];
      setComments((prev) => (append ? [...prev, ...fetched] : fetched));
      setCommentsPagination(res.data.pagination || { page: 1, limit: 50, total: 0, hasMore: false });
    } else {
      if (!append) setComments([]);
    }
    setIsLoadingComments(false);
  }, []);

  useEffect(() => {
    if (isOpen && task?.id) {
      setEditName(task.name || task.title || '');
      setEditDescription(task.description || '');
      setEditDueDate(task.dueDate ? task.dueDate.substring(0, 10) : '');
      setNewComment('');
      setIsAddingComment(false);
      setComments([]);
      setCommentsPagination({ page: 1, limit: 50, total: 0, hasMore: false });
      fetchComments(task.id);
    }
  }, [isOpen, task?.id, fetchComments]);

  if (!isOpen || !task) return null;

  const handleSaveDetails = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    const updatedTask = {
      ...task,
      name: editName.trim(),
      description: editDescription.trim(),
      dueDate: editDueDate || null,
    };
    try {
      await onUpdate(updatedTask);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !task?.id) return;
    setIsSubmittingComment(true);
    const res = await taskService.createComment(task.id, newComment.trim());
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

  const handleLoadMore = () => {
    const nextPage = commentsPagination.page + 1;
    fetchComments(task.id, nextPage, true);
  };

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

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[90vh] flex flex-col bg-bg rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-bg rounded-t-lg">
          <div className="flex-1 pr-4">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveDetails}
              className="w-full text-xl font-bold text-text bg-transparent -ml-3 -mt-2 px-3 py-2 border-none outline-none focus:bg-bg-tertiary rounded transition-colors"
              placeholder="Task name"
            />
            <p className="text-sm text-text-secondary mt-1">{task.column}</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text text-2xl font-light transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body: two-column layout */}
        <div className="flex flex-1 min-h-0">
          {/* Left Column: Task Details (always editable) */}
          <div className="w-1/2 overflow-y-auto p-6 space-y-6 border-r border-border">
            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                onBlur={handleSaveDetails}
                rows="4"
                className="w-full px-4 py-3 rounded-lg border-2 border-input-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors resize-none text-sm leading-relaxed"
                placeholder="Add a description..."
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Due Date</label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                onBlur={handleSaveDetails}
                className="w-full px-4 py-3 rounded-lg border-2 border-input-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors text-sm"
              />
            </div>
            
            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Labels</h3>
                <div className="flex gap-2 flex-wrap">
                  {task.labels.map((label) => (
                    <span
                      key={label.id}
                      className="px-3 py-1 text-xs font-bold rounded uppercase text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Members */}
            {task.assignedMembers && task.assignedMembers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Assigned To</h3>
                <div className="flex gap-2 flex-wrap">
                  {task.assignedMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-2 bg-bg-tertiary px-3 py-2 rounded border border-border">
                      <div className="w-6 h-6 rounded-full bg-button text-white text-[10px] font-bold flex items-center justify-center">
                        {member.initials}
                      </div>
                      <span className="text-sm text-text-secondary">{member.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Attachments</h3>
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href="#"
                      className="flex items-center gap-3 p-2 bg-bg-tertiary rounded border border-border hover:bg-bg-secondary transition-colors group"
                    >
                      <span className="text-lg">📎</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-accent group-hover:underline truncate">{attachment.name}</p>
                        <p className="text-xs text-text-secondary">{attachment.size}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Comments (entire column scrolls together) */}
          <div className="w-1/2 overflow-y-auto p-6 space-y-4">
            <h3 className="text-sm font-semibold text-text">
              Comments <span className="text-text-secondary">({commentsPagination.total})</span>
            </h3>

            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-3 bg-bg-tertiary border border-border rounded text-sm text-text placeholder-text-secondary resize-none focus:outline-none focus:border-input-border-focus transition-colors"
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
                    return (
                      <div key={comment.id} className="bg-bg-tertiary p-3 rounded border border-border">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {comment.author?.avatarUrl ? (
                              <img
                                src={comment.author.avatarUrl}
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
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingComments}
                    className="w-full py-2 text-sm text-text-accent hover:text-text-accent/80 transition-colors disabled:opacity-50"
                  >
                    {isLoadingComments ? 'Loading...' : 'Load more comments'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskModal;