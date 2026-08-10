import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Loader, ExternalLink, ChevronDown, Check } from 'lucide-react';
import { useWorkspaceOptional } from '../../context/WorkspaceContext';
import { taskService } from '../../services/taskService.js';
import { labelService, supabaseStorageService } from '../../services/index.js';
import MemberPicker from '../common/MemberPicker.jsx';
import CommentsSection from './CommentsSection.jsx';
import AttachmentsSection from './AttachmentsSection.jsx';
import { useDropdownPosition } from '../../hooks/useDropdownPosition.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const LABEL_COLORS = [
  '#61BD4F', '#F2D600', '#FF9F1A', '#EB5A46',
  '#C377E0', '#0079BF', '#00C2E0', '#51E898',
  '#FF78CB', '#B3BAC5',
];

const TaskModal = ({ task, isOpen, onClose, onUpdate, onCommentChange, lists, onMoveTask, boardLabels, onBoardLabelCreated, workspaceId: propWorkspaceId, readOnly = false, realtimeCommentPayload = null }) => {

  const { activeWorkspace, activeBoard } = useWorkspaceOptional();
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

  // Available colors for new labels (exclude colors already used by board labels)
  const usedColors = new Set((boardLabels || []).map(l => l.color));
  const availableLabelColors = LABEL_COLORS.filter(c => !usedColors.has(c)).length > 0
    ? LABEL_COLORS.filter(c => !usedColors.has(c))
    : LABEL_COLORS;

  // Label state
  const [taskLabels, setTaskLabels] = useState([]);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [isSavingLabels, setIsSavingLabels] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(availableLabelColors[0] || LABEL_COLORS[0]);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);

  // Attachment state
  const [attachments, setAttachments] = useState([]); // uploaded attachment metadata
  const [loadingFiles, setLoadingFiles] = useState([]); // files currently uploading
  const [previewUrls, setPreviewUrls] = useState({}); // storagePath -> signed URL
  const [isSavingAttachments, setIsSavingAttachments] = useState(false);

  const labelContainerRef = useRef(null);
  const labelDropdownRef = useRef(null);

  const [showListPicker, setShowListPicker] = useState(false);
  const listPickerRef = useRef(null);
  const listDropdownRef = useRef(null);
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const dueDateRef = useRef(null);

  const labelDropdownStyle = useDropdownPosition(labelContainerRef, showLabelPicker, { minWidth: 240, maxWidth: 320 });
  const listDropdownStyle = useDropdownPosition(listPickerRef, showListPicker, { minWidth: 180, maxWidth: 300 });


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

  // Close list picker on outside click
  useEffect(() => {
    if (!showListPicker) return;

    const handleClickOutside = (e) => {
      if (listPickerRef.current && !listPickerRef.current.contains(e.target) && !listDropdownRef.current?.contains(e.target)) {
        setShowListPicker(false);
      }
    };

    const id = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showListPicker]);

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
        setPreviewUrls({});

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

  // Sync state when task object updates (e.g. from real-time events)
  useEffect(() => {
    if (isOpen && task) {
      const active = document.activeElement;

      const newName = task.name || task.title || '';
      if (active !== titleRef.current) {
        setEditName(newName);
      }

      const newDesc = task.description || '';
      if (active !== descriptionRef.current) {
        setEditDescription(newDesc);
      }

      const newDueDate = task.dueDate ? task.dueDate.substring(0, 10) : '';
      if (active !== dueDateRef.current) {
        setEditDueDate(newDueDate);
      }

      setEditCompletedAt(task.completedAt || null);

      if (task.assignments) setAssignments(task.assignments);
      if (task.labels) setTaskLabels(task.labels);
      if (task.attachments) setAttachments(task.attachments);
    }
  }, [
    isOpen,
    task?.id,
    task?.name,
    task?.title,
    task?.description,
    task?.dueDate,
    task?.completedAt,
    task?.assignments,
    task?.labels,
    task?.attachments
  ]);


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

  const handleAddLabel = async (boardLabelId) => {
    if (!task?.id || isSavingLabels) return;
    const label = boardLabels.find(l => l.id === boardLabelId);
    if (!label || taskLabels.some(l => l.id === boardLabelId)) return;

    setIsSavingLabels(true);
    const newLabels = [...taskLabels, label];
    setTaskLabels(newLabels);

    const res = await labelService.setTaskLabels(task.id, newLabels.map(l => l.id));
    if (!res.success) {
      setTaskLabels(taskLabels);
    } else {
      onUpdate?.({
        ...task,
        name: editName || task.name,
        description: editDescription || task.description || '',
        dueDate: editDueDate || task.dueDate || null,
        completedAt: editCompletedAt || task.completedAt || null,
        labels: newLabels,
      });
    }
    setIsSavingLabels(false);
  };

  const handleRemoveLabel = async (boardLabelId) => {
    if (!task?.id || isSavingLabels) return;
    const newLabels = taskLabels.filter(l => l.id !== boardLabelId);
    setTaskLabels(newLabels);

    const res = await labelService.setTaskLabels(task.id, newLabels.map(l => l.id));
    if (!res.success) {
      setTaskLabels(taskLabels);
    } else {
      onUpdate?.({
        ...task,
        name: editName || task.name,
        description: editDescription || task.description || '',
        dueDate: editDueDate || task.dueDate || null,
        completedAt: editCompletedAt || task.completedAt || null,
        labels: newLabels,
      });
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
      setNewLabelColor(availableLabelColors[0] || LABEL_COLORS[0]);
      onBoardLabelCreated?.(newLabel);
      setIsCreatingLabel(false);
      setShowLabelPicker(false);
      // Link the new label to the task in the background
      const newLabels = [...taskLabels, newLabel];
      setTaskLabels(newLabels);
      const linkRes = await labelService.setTaskLabels(task.id, newLabels.map(l => l.id));
      if (!linkRes.success) {
        setTaskLabels(taskLabels);
      } else {
        onUpdate?.({
          ...task,
          name: editName || task.name,
          description: editDescription || task.description || '',
          dueDate: editDueDate || task.dueDate || null,
          completedAt: editCompletedAt || task.completedAt || null,
          labels: newLabels,
        });
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-surface-container-lowest rounded-DEFAULT border border-outline-variant shadow-xl w-[95vw] sm:w-[90vw] md:w-[85vw] max-w-5xl lg:max-w-6xl mx-auto max-h-[90vh] flex flex-col overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-container-low shrink-0">
          <div className="flex items-center gap-3 flex-1 pr-4 min-w-0">
            {readOnly ? (
              task?.list?.board?.id && workspaceId ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/workspaces/${workspaceId}`, { state: { selectBoardId: task.list.board.id } });
                  }}
                  className="flex items-center gap-1.5 font-mono-label text-xs font-bold uppercase text-primary hover:underline transition-all cursor-pointer"
                >
                  <ExternalLink size={14} />
                  <span className="truncate">{task.list.board.workspace?.name || 'Workspace'} / {task.list.board.name || 'Board'}</span>
                </button>
              ) : null
            ) : (
              onMoveTask && lists?.length > 0 && (
                <div ref={listPickerRef}>
                  <button
                    onClick={() => setShowListPicker(!showListPicker)}
                    className="flex items-center gap-2 font-mono-label text-xs font-bold uppercase text-on-surface bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-3 py-1.5 hover:border-primary transition-colors cursor-pointer"
                  >
                    <span className="truncate max-w-[120px] sm:max-w-none">{lists.find(l => l.id === task.listId)?.title || lists.find(l => l.id === task.listId)?.name || 'Select list'}</span>
                    <ChevronDown size={14} className={`text-secondary transition-transform shrink-0 ${showListPicker ? 'rotate-180' : ''}`} />
                  </button>
                  {showListPicker && createPortal(
                    <div
                      ref={listDropdownRef}
                      className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-xl p-1.5 space-y-0.5 z-50"
                      style={listDropdownStyle}
                    >
                      {lists.map((list) => (
                        <button
                          key={list.id}
                          type="button"
                          onClick={() => {
                            if (list.id !== task.listId) {
                              onMoveTask?.(task.id, list.id);
                            }
                            setShowListPicker(false);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-DEFAULT hover:bg-surface-container-low transition-colors text-left cursor-pointer"
                        >
                          <span className="flex-1 font-mono-label text-xs font-bold text-on-surface uppercase truncate">{list.title || list.name}</span>
                          {list.id === task.listId && (
                            <Check size={14} className="text-primary shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>,
                    document.body
                  )}
                </div>
              )
            )}
          </div>
          <button
            onClick={onClose}
            className="text-secondary hover:text-on-surface p-1 rounded-DEFAULT transition-colors shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body: responsive layout */}
        <div className="flex flex-1 min-h-0 flex-col sm:flex-row overflow-y-auto sm:overflow-hidden">
          {/* Left Column: Task Details */}
          <div className="sm:w-7/12 shrink-0 sm:overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 sm:border-r border-outline-variant sm:thin-scrollbar">
            {/* Task Title + checkbox */}
            <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-start">
              {!readOnly && (
                <label onClick={(e) => e.stopPropagation()} className="shrink-0 mt-1">
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
                    className="w-4 h-4 rounded-DEFAULT border-outline-variant accent-primary cursor-pointer shrink-0"
                  />
                </label>
              )}
              <div className="flex-1 min-w-0">
                {readOnly ? (
                  <p className="font-headline-md text-lg sm:text-xl font-bold text-on-surface py-1 break-words">
                    {editName}
                  </p>
                ) : (
                  <textarea
                    ref={(el) => {
                      titleRef.current = el;
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }
                    }}
                    value={editName}
                    onChange={(e) => {
                      setEditName(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onBlur={handleSaveDetails}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-full font-headline-md text-lg sm:text-xl font-bold text-on-surface bg-transparent border-none outline-none focus:bg-surface-container-low rounded-DEFAULT transition-colors resize-none overflow-hidden p-1"
                    placeholder="Task name"
                  />
                )}
              </div>
            </div>

              {/* Description */}
              <div className="mt-3 sm:mt-4">
                <label className="block font-mono-label text-xs uppercase font-bold text-on-surface mb-2">Description</label>
                {readOnly ? (
                  <p className="w-full p-3 rounded-DEFAULT border border-outline-variant bg-surface-container-low text-on-surface font-body-sm text-sm leading-relaxed min-h-[5rem]">
                    {editDescription || 'No description'}
                  </p>
                ) : (
                  <textarea
                    ref={descriptionRef}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onBlur={handleSaveDetails}
                    rows="3"
                    className="w-full p-3 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest text-on-surface font-body-sm text-sm outline-none focus:border-primary transition-colors resize-none leading-relaxed"
                    placeholder="Add a description..."
                  />
                )}
              </div>

              {/* Due Date */}
              <div className="mt-3 sm:mt-4">
                <label className="block font-mono-label text-xs uppercase font-bold text-on-surface mb-2">Due Date</label>
                {readOnly ? (
                  <p className="w-full p-3 rounded-DEFAULT border border-outline-variant bg-surface-container-low text-on-surface font-body-sm text-sm">
                    {editDueDate ? new Date(editDueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No due date'}
                  </p>
                ) : (
                  <input
                    ref={dueDateRef}
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    onBlur={handleSaveDetails}
                    className="w-full px-3 py-2.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest text-on-surface font-body-sm text-sm outline-none focus:border-primary transition-colors"
                  />
                )}
              </div>

              {/* Labels */}
              <div className="mt-3 sm:mt-4">
                <h3 className="font-mono-label text-xs uppercase font-bold text-on-surface mb-2">Labels</h3>
                <div className="flex gap-2 flex-wrap items-center">
                  {taskLabels.map((label) => (
                    <span
                      key={label.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 font-mono-label text-xs font-bold uppercase rounded-DEFAULT text-white shadow-2xs"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  ))}
                  {!readOnly && (
                    <div ref={labelContainerRef}>
                      <button
                        onClick={() => setShowLabelPicker(!showLabelPicker)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 font-label-caps text-xs font-bold uppercase text-secondary hover:text-on-surface bg-surface-container-lowest border border-dashed border-outline-variant hover:border-primary rounded-DEFAULT transition-all cursor-pointer"
                      >
                        + Add label
                      </button>
                      {showLabelPicker && createPortal(
                        <div
                          ref={labelDropdownRef}
                          className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-xl p-3 space-y-2 z-50"
                          style={labelDropdownStyle}
                        >
                          {boardLabels && boardLabels.length > 0 && (
                            <div className="space-y-0.5 pb-2 border-b border-outline-variant max-h-40 overflow-y-auto">
                              {boardLabels.map((label) => {
                                const isAttached = taskLabels.some((tl) => tl.id === label.id);
                                return (
                                  <button
                                    key={label.id}
                                    type="button"
                                    onClick={() => isAttached ? handleRemoveLabel(label.id) : handleAddLabel(label.id)}
                                    className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-DEFAULT hover:bg-surface-container-low transition-colors text-left group cursor-pointer"
                                  >
                                    <span
                                      className="w-3.5 h-3.5 rounded-DEFAULT shrink-0"
                                      style={{ backgroundColor: label.color }}
                                    />
                                    <span className="font-body-sm text-xs text-on-surface flex-1 truncate">{label.name}</span>
                                    {isAttached && (
                                      <X size={14} className="text-secondary hover:text-error transition-colors shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <form onSubmit={handleCreateAndAddLabel} className="space-y-2">
                            <input
                              type="text"
                              value={newLabelName}
                              onChange={(e) => setNewLabelName(e.target.value)}
                              placeholder="New label name..."
                              className="w-full px-3 py-1.5 font-body-sm text-xs rounded-DEFAULT border border-outline-variant bg-surface-container-lowest text-on-surface outline-none focus:border-primary transition-colors"
                            />
                            <div className="flex gap-1.5 flex-wrap">
                              {availableLabelColors.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => setNewLabelColor(color)}
                                  className={`w-6 h-6 rounded-DEFAULT border-2 transition-all cursor-pointer ${
                                    newLabelColor === color ? 'border-white scale-110 ring-2 ring-primary' : 'border-transparent hover:scale-110'
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <button
                              type="submit"
                              disabled={isCreatingLabel || !newLabelName.trim()}
                              className="w-full px-3 py-1.5 bg-primary text-on-primary font-label-caps text-xs font-bold uppercase tracking-wider rounded-DEFAULT hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
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
              <div className="mt-3 sm:mt-4">
                <h3 className="font-mono-label text-xs uppercase font-bold text-on-surface mb-2">Assigned To</h3>
                {readOnly ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {assignments.length === 0 && (
                      <span className="font-body-sm text-xs text-secondary">No one assigned</span>
                    )}
                    {assignments.map((a) => {
                      const avatarUrl = a.user?.avatarUrl ? supabaseStorageService.getAvatarUrl(a.user.avatarUrl) : null;
                      const name = a.user?.fullName || a.user?.email || 'Unknown';
                      return (
                        <div
                          key={a.userId}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-DEFAULT bg-surface-container-low border border-outline-variant"
                        >
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary text-on-primary text-[8px] font-bold flex items-center justify-center">
                              {(a.user?.fullName || a.user?.email || '?').split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                          )}
                          <span className="font-body-sm text-xs text-on-surface">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    {isSavingAssignees && <Loader size={12} className="inline ml-1 text-primary animate-spin" />}
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
                            onUpdate?.({ ...task, assignments: res.data });
                          }
                        } finally {
                          setIsSavingAssignees(false);
                        }
                      }}
                    />
                  </>
                )}
              </div>

              <div className="mt-3 sm:mt-4">
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
            </div>

          <CommentsSection
            taskId={task?.id}
            readOnly={readOnly}
            onCommentChange={onCommentChange}
            commentCount={task?._count?.comments ?? 0}
            realtimeCommentPayload={realtimeCommentPayload}
          />

        </div>
      </div>
    </div>
  );
};

export default TaskModal;