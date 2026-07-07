import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Upload, File, Image as ImageIcon, Loader, Plus, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { taskService } from '../../services/taskService.js';
import { labelService, supabaseStorageService } from '../../services/index.js';
import MemberPicker from '../common/MemberPicker.jsx';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const LABEL_COLORS = [
  '#61BD4F', '#F2D600', '#FF9F1A', '#EB5A46',
  '#C377E0', '#0079BF', '#00C2E0', '#51E898',
  '#FF78CB', '#B3BAC5',
];

const TaskModal = ({ task, isOpen, onClose, onUpdate, onCommentChange, lists, onMoveTask, boardLabels, onBoardLabelCreated, workspaceId: propWorkspaceId, readOnly = false }) => {
  const { user } = useAuth();
  const { activeWorkspace, activeBoard } = useWorkspace();
  const navigate = useNavigate();
  const workspaceIdRef = useRef(null);

  // Preserve workspaceId across task data updates (e.g. after updateTask response
  // may not include list.board.workspace). Capture it once when the modal opens.
  if (isOpen && task) {
    const resolved = propWorkspaceId || activeWorkspace?.id;
    if (resolved) workspaceIdRef.current = resolved;
  }
  const workspaceId = workspaceIdRef.current || propWorkspaceId || activeWorkspace?.id;
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Inline editable fields
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editCompletedAt, setEditCompletedAt] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Comment state
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsPagination, setCommentsPagination] = useState({ page: 1, limit: 50, total: 0, hasMore: false });
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  // Assignment state
  const [assignments, setAssignments] = useState([]);
  const [isSavingAssignees, setIsSavingAssignees] = useState(false);

  // Label state
  const [taskLabels, setTaskLabels] = useState([]);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [isSavingLabels, setIsSavingLabels] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);

  // Attachment state
  const [attachments, setAttachments] = useState([]); // uploaded attachment metadata
  const [loadingFiles, setLoadingFiles] = useState([]); // files currently uploading
  const [previewUrls, setPreviewUrls] = useState({}); // storagePath -> signed URL
  const [isSavingAttachments, setIsSavingAttachments] = useState(false);

  // Infinite scroll refs
  const scrollContainerRef = useRef(null);
  const sentinelRef = useRef(null);

  const isImageAttachment = (attachment) => {
    return attachment.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachment.fileName);
  };

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

  // Reset state when modal opens and load signed URLs for existing attachments
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (isOpen && task?.id) {
        setEditName(task.name || task.title || '');
        setEditDescription(task.description || '');
        setEditDueDate(task.dueDate ? task.dueDate.substring(0, 10) : '');
        setEditCompletedAt(task.completedAt || null);
        setNewComment('');
        setIsAddingComment(false);
        setComments([]);
        setCommentsPagination({ page: 1, limit: 50, total: 0, hasMore: false });
        setLoadingFiles([]);
        setIsSavingAttachments(false);
        setAssignments(task.assignments || []);
        setTaskLabels(task.labels || []);
        if (task._count?.comments > 0) {
          fetchComments(task.id);
        }

        // Initialize attachments from the task
        const existingAttachments = task.attachments || [];
        setAttachments(existingAttachments);

        // Load signed URLs for existing image attachments
        const imageAtts = existingAttachments.filter(isImageAttachment);
        const urls = {};
        for (const att of imageAtts) {
          try {
            const url = await supabaseStorageService.getFileUrl(att.storagePath, 3600);
            if (!cancelled && url) {
              urls[att.storagePath] = url;
            }
          } catch (err) {
            console.error('Failed to load preview for', att.fileName, err);
          }
        }
        if (!cancelled) {
          setPreviewUrls((prev) => ({ ...prev, ...urls }));
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, [isOpen, task?.id, fetchComments]);

  // Infinite scroll: observe sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container || !commentsPagination.hasMore || isLoadingComments) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && commentsPagination.hasMore && !isLoadingComments) {
          const nextPage = commentsPagination.page + 1;
          fetchComments(task.id, nextPage, true);
        }
      },
      { root: container, rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [commentsPagination, isLoadingComments, task?.id, fetchComments]);

  if (!isOpen || !task) return null;

  // Persist the current attachment set to the backend immediately
  const saveAttachments = async (updatedAttachments) => {
    if (isSavingAttachments) return;
    setIsSavingAttachments(true);
    try {
      const payload = {
        name: editName.trim() || task.name,
        description: editDescription.trim() || task.description || '',
        dueDate: editDueDate || task.dueDate || null,
        completedAt: editCompletedAt || null,
        attachments: updatedAttachments.map((a) => ({
          fileName: a.fileName,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
          storagePath: a.storagePath,
        })),
      };
      await onUpdate({ ...task, ...payload });
    } finally {
      setIsSavingAttachments(false);
    }
  };

  const syncLabelsToBoard = async (newLabels) => {
    const payload = {
      name: editName.trim() || task.name,
      description: editDescription.trim() || task.description || '',
      dueDate: editDueDate || task.dueDate || null,
      completedAt: editCompletedAt || null,
      attachments: attachments.map(a => ({
        fileName: a.fileName,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
        storagePath: a.storagePath,
      })),
    };
    await onUpdate({ ...task, ...payload });
  };

  const handleAddLabel = async (boardLabelId) => {
    if (!task?.id || isSavingLabels) return;
    const label = boardLabels.find(l => l.id === boardLabelId);
    if (!label || taskLabels.some(l => l.id === boardLabelId)) return;

    setIsSavingLabels(true);
    const newLabels = [...taskLabels, label];
    setTaskLabels(newLabels);
    setShowLabelPicker(false);

    const res = await labelService.setTaskLabels(task.id, newLabels.map(l => l.id));
    if (res.success) {
      await syncLabelsToBoard(newLabels);
    } else {
      setTaskLabels(taskLabels);
    }
    setIsSavingLabels(false);
  };

  const handleRemoveLabel = async (boardLabelId) => {
    if (!task?.id || isSavingLabels) return;
    const newLabels = taskLabels.filter(l => l.id !== boardLabelId);
    setTaskLabels(newLabels);

    const res = await labelService.setTaskLabels(task.id, newLabels.map(l => l.id));
    if (res.success) {
      await syncLabelsToBoard(newLabels);
    } else {
      setTaskLabels(taskLabels);
    }
  };

  const handleCreateAndAddLabel = async (e) => {
    e.preventDefault();
    const boardId = activeBoard?.id || task?.list?.board?.id;
    if (!newLabelName.trim() || !boardId || isCreatingLabel) return;
    setIsCreatingLabel(true);
    const res = await labelService.createBoardLabel(boardId, {
      name: newLabelName.trim(),
      color: newLabelColor,
    });
    if (res.success) {
      const newLabel = res.data;
      setNewLabelName('');
      setNewLabelColor(LABEL_COLORS[0]);
      onBoardLabelCreated?.(newLabel);
      // Immediately add the newly created label to the task
      const newLabels = [...taskLabels, newLabel];
      setTaskLabels(newLabels);
      const linkRes = await labelService.setTaskLabels(task.id, newLabels.map(l => l.id));
      if (linkRes.success) {
        await syncLabelsToBoard(newLabels);
      } else {
        setTaskLabels(taskLabels);
      }
    }
    setIsCreatingLabel(false);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!workspaceId) {
      console.error('No workspace context');
      return;
    }

    const newLoading = [...loadingFiles];
    const newAttachments = [...attachments];

    // Show loading spinners for all files immediately
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        console.error(`File "${file.name}" exceeds the 10 MB limit.`);
        continue;
      }
      newLoading.push({ id: crypto.randomUUID(), name: file.name, status: 'uploading' });
    }
    setLoadingFiles([...newLoading]);

    // Upload all files to Supabase Storage in parallel
    const uploadPromises = files
      .filter((file) => file.size <= MAX_FILE_SIZE)
      .map(async (file) => {
        const metadata = await supabaseStorageService.uploadTaskFile(workspaceId, file);
        // Create preview for image files
        if (file.type.startsWith('image/')) {
          try {
            const url = await supabaseStorageService.getFileUrl(metadata.storagePath, 3600);
            if (url) {
              setPreviewUrls((prev) => ({ ...prev, [metadata.storagePath]: url }));
            }
          } catch {
            // preview not essential
          }
        }
        return metadata;
      });

    const results = await Promise.allSettled(uploadPromises);
    for (const result of results) {
      if (result.status === 'fulfilled') {
        newAttachments.push(result.value);
      } else {
        console.error(result.reason?.message || 'File upload failed');
      }
    }

    // Update state once and auto-save
    setAttachments([...newAttachments]);
    setLoadingFiles([]);
    await saveAttachments(newAttachments);

    e.target.value = '';
  };

  const removeAttachment = async (index) => {
    const attachment = attachments[index];
    // Clean up preview URL
    setPreviewUrls((prev) => {
      const next = { ...prev };
      delete next[attachment.storagePath];
      return next;
    });
    // If it was newly uploaded (has no DB id), delete from storage
    if (!attachment.id) {
      try {
        await supabaseStorageService.deleteFile(attachment.storagePath);
      } catch {
        // Silently fail - storage cleanup is best-effort
      }
    }
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);

    // Auto-save: persist the updated attachment set immediately
    await saveAttachments(newAttachments);
  };

  const handleSaveDetails = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);

    const updatedTask = {
      ...task,
      name: editName.trim(),
      description: editDescription.trim(),
      dueDate: editDueDate || null,
      completedAt: editCompletedAt || null,
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
      onCommentChange?.(task.id, 1);
    }
    setIsSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId) => {
    setDeletingCommentId(commentId);
    const res = await taskService.deleteComment(commentId);
    if (res.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      onCommentChange?.(task.id, -1);
    }
    setDeletingCommentId(null);
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
          <div className="flex items-center gap-3 flex-1 pr-4">
            {!readOnly && (
              <label onClick={(e) => e.stopPropagation()} className="shrink-0">
                <input
                  type="checkbox"
                  checked={!!editCompletedAt}
                  onChange={async (e) => {
                    const newCompletedAt = e.target.checked ? new Date().toISOString() : null;
                    setEditCompletedAt(newCompletedAt);
                    const updatedTask = {
                      ...task,
                      name: editName.trim() || task.name,
                      description: editDescription.trim() || task.description || '',
                      dueDate: editDueDate || task.dueDate || null,
                      completedAt: newCompletedAt,
                    };
                    await onUpdate(updatedTask);
                  }}
                  className="w-5 h-5 rounded border-text-secondary accent-button cursor-pointer"
                />
              </label>
            )}
            <div className="flex-1">
              {readOnly ? (
                <p className="text-xl font-bold text-text py-2">
                  {editName}
                </p>
              ) : (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleSaveDetails}
                  className="w-full text-xl font-bold text-text bg-transparent -ml-3 -mt-2 px-3 py-2 border-none outline-none focus:bg-bg-tertiary rounded transition-colors"
                  placeholder="Task name"
                />
              )}
              {readOnly ? (
                task?.list?.board?.id && workspaceId ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/workspaces/${workspaceId}`, { state: { selectBoardId: task.list.board.id } });
                    }}
                    className="flex items-center gap-1.5 text-sm font-medium text-button hover:text-button-hover transition-colors mt-1"
                  >
                    <ExternalLink size={14} />
                    {task.list.board.workspace?.name || 'Workspace'} / {task.list.board.name || 'Board'}
                  </button>
                ) : null
              ) : (
                onMoveTask && lists?.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={task.listId}
                      onChange={(e) => {
                        const targetListId = e.target.value;
                        if (targetListId !== task.listId) {
                          onMoveTask?.(task.id, targetListId);
                        }
                      }}
                      className="text-sm text-text-secondary bg-transparent border border-border rounded px-2 py-0.5 outline-none focus:border-input-border-focus cursor-pointer"
                    >
                      {lists?.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.title || list.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              )}
            </div>
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
          {/* Left Column: Task Details */}
          <div className="w-1/2 overflow-y-auto p-6 space-y-6 border-r border-border thin-scrollbar">
            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Description</label>
              {readOnly ? (
                <p className="w-full px-4 py-3 rounded-lg border-2 border-input-border bg-bg text-text text-sm leading-relaxed min-h-[5rem]">
                  {editDescription || 'No description'}
                </p>
              ) : (
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onBlur={handleSaveDetails}
                  rows="4"
                  className="w-full px-4 py-3 rounded-lg border-2 border-input-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors resize-none text-sm leading-relaxed"
                  placeholder="Add a description..."
                />
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Due Date</label>
              {readOnly ? (
                <p className="w-full px-4 py-3 rounded-lg border-2 border-input-border bg-bg text-text text-sm">
                  {editDueDate ? new Date(editDueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No due date'}
                </p>
              ) : (
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  onBlur={handleSaveDetails}
                  className="w-full px-4 py-3 rounded-lg border-2 border-input-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors text-sm"
                />
              )}
            </div>

            {/* Labels */}
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">Labels</h3>
              <div className="flex gap-2 flex-wrap items-center">
                {taskLabels.length === 0 && (
                  <span className="text-sm text-text-secondary">No labels</span>
                )}
                {taskLabels.map((label) => (
                  <span
                    key={label.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded uppercase text-white group"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                    {!readOnly && (
                      <button
                        onClick={() => handleRemoveLabel(label.id)}
                        className="opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded-sm transition-opacity"
                        title="Remove label"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </span>
                ))}
                {!readOnly && (
                  <div className="relative">
                    <button
                      onClick={() => setShowLabelPicker(!showLabelPicker)}
                      className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border border-dashed border-border text-text-secondary hover:text-text hover:border-text-secondary transition-colors"
                    >
                      <Plus size={12} />
                      Label
                    </button>
                    {showLabelPicker && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowLabelPicker(false)} />
                        <div className="absolute top-full left-0 mt-1 z-20 w-56 bg-bg border border-border rounded-lg shadow-xl p-2 space-y-1">
                          {boardLabels && boardLabels.filter((bl) => !taskLabels.some((tl) => tl.id === bl.id)).length > 0 && (
                            <div className="space-y-1 pb-1 border-b border-border">
                              {boardLabels
                                .filter((bl) => !taskLabels.some((tl) => tl.id === bl.id))
                                .map((label) => (
                                  <button
                                    key={label.id}
                                    onClick={() => handleAddLabel(label.id)}
                                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-bg-tertiary transition-colors text-left"
                                  >
                                    <span
                                      className="w-3 h-3 rounded shrink-0"
                                      style={{ backgroundColor: label.color }}
                                    />
                                    <span className="text-sm text-text">{label.name}</span>
                                  </button>
                                ))
                              }
                            </div>
                          )}
                          <form onSubmit={handleCreateAndAddLabel} className="space-y-1.5 pt-1">
                            <input
                              type="text"
                              value={newLabelName}
                              onChange={(e) => setNewLabelName(e.target.value)}
                              placeholder="New label name..."
                              className="w-full px-2 py-1 text-xs rounded border border-input-border bg-bg text-text outline-none focus:border-input-border-focus"
                            />
                            <div className="flex gap-1 flex-wrap">
                              {LABEL_COLORS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => setNewLabelColor(color)}
                                  className={`w-4 h-4 rounded-full border transition-all ${
                                    newLabelColor === color ? 'border-white scale-110 ring-1 ring-accent' : 'border-transparent'
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <button
                              type="submit"
                              disabled={isCreatingLabel || !newLabelName.trim()}
                              className="w-full px-2 py-1 bg-button hover:bg-button-hover text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                            >
                              {isCreatingLabel ? 'Creating...' : 'Create'}
                            </button>
                          </form>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Members */}
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">Assigned To</h3>
              {readOnly ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {assignments.length === 0 && (
                    <span className="text-sm text-text-secondary">No one assigned</span>
                  )}
                  {assignments.map((a) => {
                    const avatarUrl = a.user?.avatarUrl ? supabaseStorageService.getAvatarUrl(a.user.avatarUrl) : null;
                    const name = a.user?.fullName || a.user?.email || 'Unknown';
                    return (
                      <div
                        key={a.userId}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bg-tertiary border border-border"
                      >
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-button text-white text-[8px] font-bold flex items-center justify-center">
                            {(a.user?.fullName || a.user?.email || '?').split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                        )}
                        <span className="text-sm text-text">{name}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  {isSavingAssignees && <Loader size={12} className="inline ml-1 text-accent animate-spin" />}
                  <MemberPicker
                    workspaceId={workspaceId}
                    selectedUserIds={assignments.map(a => a.userId)}
                    selectedUsers={assignments.map(a => a.user)}
                    onChange={async (userIds) => {
                      setIsSavingAssignees(true);
                      try {
                        const res = await taskService.setTaskAssignees(task.id, userIds);
                        if (res.success) {
                          setAssignments(res.data);
                        }
                        const updatedData = {
                          name: editName.trim() || task.name,
                          description: editDescription.trim() || task.description || '',
                          dueDate: editDueDate || task.dueDate || null,
                          completedAt: editCompletedAt || null,
                          attachments: attachments.map(a => ({
                            fileName: a.fileName,
                            fileSize: a.fileSize,
                            mimeType: a.mimeType,
                            storagePath: a.storagePath,
                          })),
                        };
                        await onUpdate({ ...task, ...updatedData });
                      } finally {
                        setIsSavingAssignees(false);
                      }
                    }}
                  />
                </>
              )}
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">
                Attachments {attachments.length > 0 && <span className="text-text-secondary">({attachments.length})</span>}
              </label>

              {attachments.length === 0 && (
                <p className="text-sm text-text-secondary">No attachments</p>
              )}

              {/* Attachment list */}
              {attachments.length > 0 && (
                <div className="space-y-2 mb-3">
                  {attachments.map((attachment, index) => {
                    const previewUrl = previewUrls[attachment.storagePath];
                    const isImage = isImageAttachment(attachment);
                    return (
                      <div
                        key={attachment.storagePath || attachment.id || index}
                        className="flex items-center justify-between p-2 bg-bg-tertiary rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {isImage && previewUrl ? (
                            <img
                              src={previewUrl}
                              alt={attachment.fileName}
                              className="w-10 h-10 rounded-md object-cover border border-border shrink-0"
                            />
                          ) : isImage ? (
                            <div className="w-10 h-10 flex items-center justify-center bg-bg rounded-md border border-border shrink-0">
                              <ImageIcon size={16} className="text-text-secondary" />
                            </div>
                          ) : (
                            <File size={16} className="text-text-secondary shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm text-text-accent truncate">{attachment.fileName}</p>
                            <p className="text-xs text-text-secondary">
                              {attachment.fileSize ? formatFileSize(attachment.fileSize) : ''}
                            </p>
                          </div>
                        </div>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            disabled={isSavingAttachments}
                            className="p-1.5 text-text-secondary hover:text-red-500 rounded transition-colors shrink-0 ml-2 disabled:opacity-50"
                            title="Remove file"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Upload UI (only in edit mode) */}
              {!readOnly && (
                <>
                  {loadingFiles.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {loadingFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 p-2 bg-bg-tertiary rounded-lg border border-border"
                        >
                          <Loader size={16} className="text-accent animate-spin shrink-0" />
                          <span className="text-sm text-text-secondary">{file.name}</span>
                          <span className="text-xs text-accent ml-auto">Uploading...</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-border bg-bg cursor-pointer hover:border-accent/50 transition-colors ${isSavingAttachments ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Upload size={18} className="text-text-secondary" />
                    <span className="text-sm font-medium text-text-secondary">
                      {loadingFiles.length > 0
                        ? 'Add another file...'
                        : 'Click to upload files'}
                    </span>
                    <span className="text-xs text-text-secondary ml-auto">Max 10 MB per file</span>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={loadingFiles.length > 0 || isSavingAttachments}
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Comments (entire column scrolls together) */}
          <div ref={scrollContainerRef} className="w-1/2 overflow-y-auto p-6 space-y-4 thin-scrollbar">
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

                {/* Sentinel for infinite scroll */}
                {commentsPagination.hasMore && (
                  <div ref={sentinelRef} className="h-4" />
                )}

                {/* Loading indicator for next pages */}
                {isLoadingComments && comments.length > 0 && (
                  <div className="text-sm text-text-secondary py-2 text-center">Loading more...</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default TaskModal;