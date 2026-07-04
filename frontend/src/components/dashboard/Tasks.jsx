import React, { useState, useEffect, useCallback } from 'react';
import { taskService, listService, labelService } from '../../services/index.js';
import { useWorkspace } from '../../context/WorkspaceContext';
import TaskModal from '../board/TaskModal.jsx';
import { Calendar, MessageSquare, Paperclip, Loader } from 'lucide-react';

const Tasks = () => {
  const { updateTask, moveTask } = useWorkspace();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [boardLists, setBoardLists] = useState([]);
  const [boardLabels, setBoardLabels] = useState([]);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await taskService.getMyTasks();
    if (res.success) {
      setTasks(res.data);
    } else {
      setError(res.error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleComplete = async (assignmentId, taskId, completedAt) => {
    setUpdatingIds((prev) => new Set(prev).add(taskId));
    const res = await updateTask(taskId, { completed: !!completedAt });
    if (res.success) {
      setTasks((prev) =>
        completedAt
          ? prev.filter((a) => a.id !== assignmentId)
          : prev.map((a) =>
              a.task.id === taskId
                ? { ...a, task: { ...a.task, completedAt: null } }
                : a
            )
      );
    }
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  };

  const normalizeTask = (task) => ({
    ...task,
    labels: (task.taskLabels || []).map(tl => tl.boardLabel)
  });

  const openModal = async (assignment) => {
    setSelectedTask(normalizeTask(assignment.task));
    setBoardLists([]);
    setBoardLabels([]);
    setIsModalOpen(true);

    const boardId = assignment.task.list?.board?.id;
    if (boardId) {
      const [listsRes, labelsRes] = await Promise.all([
        listService.getBoardLists(boardId),
        labelService.getBoardLabels(boardId),
      ]);
      if (listsRes.success) setBoardLists(listsRes.data);
      if (labelsRes.success) setBoardLabels(labelsRes.data);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleTaskUpdate = async (updatedTask) => {
    const payload = {
      name: updatedTask.name || updatedTask.title,
      description: updatedTask.description || '',
      dueDate: updatedTask.dueDate || null,
      completed: !!updatedTask.completedAt,
    };
    if (updatedTask.attachments) {
      payload.attachments = updatedTask.attachments;
    }
    const res = await updateTask(updatedTask.id, payload);
    if (res.success) {
      const normalized = normalizeTask(res.data);
      setTasks((prev) =>
        prev.map((a) =>
          a.task.id === updatedTask.id
            ? { ...a, task: normalized }
            : a
        )
      );
      setSelectedTask(normalized);

      if (normalized.completedAt) {
        setTasks((prev) => prev.filter((a) => a.task.id !== updatedTask.id));
      }
    }
    return res;
  };

  const handleMoveTaskToList = async (taskId, targetListId) => {
    const moveRes = await moveTask(taskId, { listId: targetListId });
    if (moveRes.success) {
      setTasks((prev) =>
        prev.map((a) =>
          a.task.id === taskId
            ? { ...a, task: { ...a.task, listId: targetListId } }
            : a
        )
      );
      setSelectedTask((prev) =>
        prev?.id === taskId ? { ...prev, listId: targetListId } : prev
      );
    }
  };

  const dueLabel = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)}d`, urgent: true };
    if (diffDays === 0) return { text: 'Today', urgent: true };
    if (diffDays === 1) return { text: 'Tomorrow', urgent: false };
    if (diffDays <= 7) return { text: `In ${diffDays}d`, urgent: false };
    return { text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), urgent: false };
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-8 bg-bg-secondary">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-center py-20">
          <Loader size={24} className="text-text-accent animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto p-8 bg-bg-secondary">
        <div className="max-w-4xl mx-auto w-full text-center py-20">
          <p className="text-red-500">Failed to load tasks: {error}</p>
          <button
            onClick={fetchTasks}
            className="mt-4 px-4 py-2 bg-button text-white text-sm font-medium rounded hover:bg-button-hover transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-bg-secondary">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text">Your Unified Task List</h1>
          <p className="text-text-secondary">All tasks assigned to you across all workspaces.</p>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-secondary">No pending tasks. You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((assignment) => {
              const task = assignment.task;
              const due = dueLabel(task.dueDate);
              const commentCount = task._count?.comments ?? 0;
              const isUpdating = updatingIds.has(task.id);
              return (
                <div
                  key={assignment.id}
                  className="bg-bg-secondary p-4 rounded-xl border border-border shadow-sm flex items-center justify-between group hover:border-input-border-focus transition-colors cursor-pointer"
                  onClick={() => openModal(assignment)}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <label onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <input
                        type="checkbox"
                        checked={!!task.completedAt}
                        disabled={isUpdating}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(
                            assignment.id,
                            task.id,
                            e.target.checked ? new Date().toISOString() : null
                          );
                        }}
                        className="w-5 h-5 rounded-full border-text-secondary accent-button cursor-pointer disabled:opacity-50"
                      />
                    </label>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold text-text truncate ${isUpdating ? 'opacity-50' : ''}`}>
                        {task.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-bold text-text-accent bg-input-bg px-2 py-0.5 rounded">
                          {task.list?.board?.workspace?.name || 'Workspace'}
                        </span>
                        <span className="text-[10px] font-medium text-text-secondary">•</span>
                        <span className="text-[10px] font-medium text-text-secondary">
                          {task.list?.board?.name || 'Board'}
                        </span>
                        {commentCount > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-text-secondary">
                            <MessageSquare size={10} />
                            {commentCount}
                          </span>
                        )}
                        {task.attachments?.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-text-secondary">
                            <Paperclip size={10} />
                            {task.attachments.length}
                          </span>
                        )}
                      </div>
                    </div>
                    {task.assignments?.length > 0 && (
                      <div className="hidden sm:flex items-center shrink-0" title={task.assignments.map(a => a.user?.fullName || a.user?.email || '?').join(', ')}>
                        {task.assignments.slice(0, 3).map((a, i, arr) => (
                          <div
                            key={a.userId}
                            className="w-6 h-6 rounded-full bg-button border-2 border-bg-secondary flex items-center justify-center text-[8px] text-white font-bold -ml-[6px] first:ml-0 overflow-hidden"
                            style={{ zIndex: arr.length - i }}
                          >
                            {getInitials(a.user?.fullName || a.user?.email)}
                          </div>
                        ))}
                        {task.assignments.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-bg-tertiary border-2 border-bg-secondary flex items-center justify-center text-[8px] text-text-secondary font-bold -ml-[6px]">
                            +{task.assignments.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {due && (
                      <span className={`text-xs font-semibold whitespace-nowrap transition-colors ${
                        due.urgent ? 'text-red-500' : 'text-text-secondary group-hover:text-text-accent'
                      }`}>
                        <Calendar size={12} className="inline mr-1" />
                        {due.text}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={closeModal}
        onUpdate={handleTaskUpdate}
        onMoveTask={handleMoveTaskToList}
        lists={boardLists}
        boardLabels={boardLabels}
        onBoardLabelCreated={(label) => setBoardLabels(prev => [...prev, label])}
        workspaceId={selectedTask?.list?.board?.workspace?.id}
      />
    </div>
  );
};

export default Tasks;
