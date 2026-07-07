import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Trash2, Loader, Plus, ExternalLink } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { taskService } from '../../services/taskService.js';
import { labelService, supabaseStorageService } from '../../services/index.js';
import MemberPicker from '../common/MemberPicker.jsx';
import CommentsSection from './CommentsSection.jsx';
import AttachmentsSection from './AttachmentsSection.jsx';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const LABEL_COLORS = [
  '#61BD4F', '#F2D600', '#FF9F1A', '#EB5A46',
  '#C377E0', '#0079BF', '#00C2E0', '#51E898',
  '#FF78CB', '#B3BAC5',
];

const TaskModal = ({ task, isOpen, onClose, onUpdate, onCommentChange, lists, onMoveTask, boardLabels, onBoardLabelCreated, workspaceId: propWorkspaceId, readOnly = false }) => {
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
  // Inline editable fields
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editCompletedAt, setEditCompletedAt] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const labelContainerRef = useRef(null);
  const labelDropdownRef = useRef(null);

  // Close label picker on outside click
  useEffect(() => {
    if (!showLabelPicker) return;

    const handleClickOutside = (e) => {
      if (labelContainerRef.current && !labelContainerRef.current.contains(e.target) && !labelDropdownRef.current?.contains(e.target)) {
        setShowLabelPicker(false);
      }
    };

    const id = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLabelPicker]);

  const isImageAttachment = (attachment) => {
    return attachment.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachment.fileName);
  };

  // Reset state when modal opens and load signed URLs for existing attachments
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (isOpen && task?.id) {
        setEditName(task.name || task.title || '');
        setEditDescription(task.description || '');
        setEditDueDate(task.dueDate ? task.dueDate.substring(0, 10) : '');
        setEditCompletedAt(task.completedAt || null);
        setLoadingFiles([]);
        setIsSavingAttachments(false);
        setAssignments(task.assignments || []);
        setTaskLabels(task.labels || []);

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
  }, [isOpen, task?.id]);

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
      setIsCreatingLabel(false);
      setShowLabelPicker(false);
      // Link the new label to the task in the background
      const newLabels = [...taskLabels, newLabel];
      setTaskLabels(newLabels);
      const linkRes = await labelService.setTaskLabels(task.id, newLabels.map(l => l.id));
      if (linkRes.success) {
        await syncLabelsToBoard(newLabels);
      } else {
        setTaskLabels(taskLabels);
      }
      return;
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
                  <div ref={labelContainerRef}>
                    <button
                      onClick={() => setShowLabelPicker(!showLabelPicker)}
                      className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border border-dashed border-border text-text-secondary hover:text-text hover:border-text-secondary transition-colors"
                    >
                      <Plus size={12} />
                      Label
                    </button>
                    {showLabelPicker && labelContainerRef.current && createPortal(
                      <div
                        ref={labelDropdownRef}
                        className="fixed z-[100] bg-bg border border-border rounded-lg shadow-xl p-2 space-y-1"
                        style={{
                          top: labelContainerRef.current.getBoundingClientRect().bottom + 4,
                          left: labelContainerRef.current.getBoundingClientRect().left,
                        }}
                      >
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
                      </div>,
                      document.body
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

            <AttachmentsSection
              attachments={attachments}
              loadingFiles={loadingFiles}
              previewUrls={previewUrls}
              isSavingAttachments={isSavingAttachments}
              readOnly={readOnly}
              onFileSelect={handleFileSelect}
              onRemoveAttachment={removeAttachment}
            />
          </div>

          <CommentsSection
            taskId={task?.id}
            readOnly={readOnly}
            onCommentChange={onCommentChange}
          />
        </div>
      </div>
    </>
  );
};

export default TaskModal;