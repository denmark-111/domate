import React, { useState, useEffect, useCallback, useRef } from 'react';
import { taskService, listService, labelService, supabaseStorageService } from '../../services/index.js';
import { useWorkspace } from '../../context/WorkspaceContext';
import TaskModal from '../board/TaskModal.jsx';
import { Calendar, MessageSquare, Paperclip, Loader } from 'lucide-react';

const Tasks = () => {
  const { updateTask, moveTask } = useWorkspace();
  const [activeTab, setActiveTab] = useState('active');
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [activePagination, setActivePagination] = useState(null);
  const [completedPagination, setCompletedPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompletedLoading, setIsCompletedLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [boardLists, setBoardLists] = useState([]);
  const [boardLabels, setBoardLabels] = useState([]);
  const scrollContainerRef = useRef(null);
  const sentinelRef = useRef(null);

  const fetchTasks = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    const res = await taskService.getMyTasks({ status: 'active', page, limit: 15 });
    if (res.success) {
      if (page === 1) {
        setTasks(res.data);
      } else {
        setTasks(prev => [...prev, ...res.data]);
      }
      setActivePagination(res.pagination);
    } else {
      setError(res.error);
    }
    setIsLoading(false);
  }, []);

  const fetchCompletedTasks = useCallback(async (page = 1) => {
    setIsCompletedLoading(true);
    setError(null);
    const res = await taskService.getMyTasks({ status: 'completed', page, limit: 15, weeks: 12 });
    if (res.success) {
      if (page === 1) {
        setCompletedTasks(res.data);
      } else {
        setCompletedTasks(prev => [...prev, ...res.data]);
      }
      setCompletedPagination(res.pagination);
    } else {
      setError(res.error);
    }
    setIsCompletedLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks(1);
  }, [fetchTasks]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'completed') {
      setIsCompletedLoading(true);
      fetchCompletedTasks(1);
    } else if (tab === 'active' && !activePagination) {
      setIsLoading(true);
      fetchTasks(1);
    }
  };

  const handleToggleComplete = async (assignment, completedAt) => {
    const taskId = assignment.task.id;
    setUpdatingIds((prev) => new Set(prev).add(taskId));
    const res = await updateTask(taskId, { completed: !!completedAt });
    if (res.success) {
      setTasks((prev) =>
        completedAt
          ? prev.filter((a) => a.id !== assignment.id)
          : prev.map((a) =>
              a.task.id === taskId
                ? { ...a, task: { ...a.task, completedAt: null } }
                : a
          )
      );
      setCompletedTasks((prev) =>
        completedAt
          ? [{ ...assignment, task: { ...assignment.task, completedAt } }, ...prev]
          : prev.filter((a) => a.id !== assignment.id)
      );
      setActivePagination((prev) => {
        if (!prev) return prev;
        const total = prev.total - 1;
        return { ...prev, total, hasMore: prev.page * prev.limit < total };
      });
      setCompletedPagination((prev) => {
        if (!prev) return prev;
        const total = prev.total + 1;
        return { ...prev, total, hasMore: prev.page * prev.limit < total };
      });
    }
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  };

  const handleToggleUncomplete = async (assignment, taskId) => {
    setUpdatingIds((prev) => new Set(prev).add(taskId));
    const res = await updateTask(taskId, { completed: false });
    if (res.success) {
      setCompletedTasks((prev) => prev.filter((a) => a.id !== assignment.id));
      setTasks((prev) => [
        { ...assignment, task: res.data },
        ...prev,
      ]);
      setActivePagination((prev) => {
        if (!prev) return prev;
        const total = prev.total + 1;
        return { ...prev, total, hasMore: prev.page * prev.limit < total };
      });
      setCompletedPagination((prev) => {
        if (!prev) return prev;
        const total = prev.total - 1;
        return { ...prev, total, hasMore: prev.page * prev.limit < total };
      });
    }
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;

    const pagination = activeTab === 'active' ? activePagination : completedPagination;
    const isLoadingState = activeTab === 'active' ? isLoading : isCompletedLoading;

    if (!pagination?.hasMore || isLoadingState) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === 'active') {
            fetchTasks(pagination.page + 1);
          } else {
            fetchCompletedTasks(pagination.page + 1);
          }
        }
      },
      { root: container, rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, activePagination, completedPagination, isLoading, isCompletedLoading, fetchTasks, fetchCompletedTasks]);

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
      setSelectedTask(normalized);

      setTasks((prev) => {
        const inActive = prev.some((a) => a.task.id === updatedTask.id);
        if (!inActive) return prev;
        if (normalized.completedAt) {
          return prev.filter((a) => a.task.id !== updatedTask.id);
        }
        return prev.map((a) =>
          a.task.id === updatedTask.id ? { ...a, task: normalized } : a
        );
      });

      setCompletedTasks((prev) => {
        const inCompleted = prev.some((a) => a.task.id === updatedTask.id);
        if (!inCompleted) return prev;
        if (!normalized.completedAt) {
          return prev.filter((a) => a.task.id !== updatedTask.id);
        }
        return prev.map((a) =>
          a.task.id === updatedTask.id ? { ...a, task: normalized } : a
        );
      });
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
      setCompletedTasks((prev) =>
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

  const renderTaskRow = (assignment, isCompleted) => {
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
              checked={isCompleted}
              disabled={isUpdating}
              onChange={(e) => {
                e.stopPropagation();
                if (isCompleted) {
                  handleToggleUncomplete(assignment, task.id);
                } else {
                  handleToggleComplete(assignment, e.target.checked ? new Date().toISOString() : null);
                }
              }}
              className="w-5 h-5 rounded-full border-text-secondary accent-button cursor-pointer disabled:opacity-50"
            />
          </label>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold truncate ${isUpdating ? 'opacity-50' : ''} ${isCompleted ? 'line-through text-text-secondary' : 'text-text'}`}>
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
              {task.assignments.slice(0, 3).map((a, i, arr) => {
                const avatarUrl = a.user?.avatarUrl ? supabaseStorageService.getAvatarUrl(a.user.avatarUrl) : null;
                return (
                  <div
                    key={a.userId}
                    className="w-6 h-6 rounded-full bg-button border-2 border-bg-secondary flex items-center justify-center text-[8px] text-white font-bold -ml-[6px] first:ml-0 overflow-hidden"
                    style={{ zIndex: arr.length - i }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(a.user?.fullName || a.user?.email)
                    )}
                  </div>
                );
              })}
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
  };

  const listItems = activeTab === 'active' ? tasks : completedTasks;
  const isEmpty = listItems.length === 0;

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8 bg-bg-secondary">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text">Your Unified Task List</h1>
          <p className="text-text-secondary">All tasks assigned to you across all workspaces.</p>
        </div>

        <div className="flex gap-6 border-b border-border">
          <button
            onClick={() => handleTabChange('active')}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === 'active'
                ? 'text-text border-b-2 border-button'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => handleTabChange('completed')}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === 'completed'
                ? 'text-text border-b-2 border-button'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            Completed
          </button>
        </div>

        {activeTab === 'active' && activePagination && (
          <p className="text-xs text-text-secondary mt-6 mb-2">
            {activePagination.total} active task{activePagination.total !== 1 ? 's' : ''}
          </p>
        )}

        {activeTab === 'completed' && completedPagination && (
          <p className="text-xs text-text-secondary mt-6 mb-2">
            {completedPagination.total} completed task{completedPagination.total !== 1 ? 's' : ''}
          </p>
        )}

        {activeTab === 'active' && isLoading && tasks.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <Loader size={24} className="text-text-accent animate-spin" />
          </div>
        )}

        {activeTab === 'completed' && isCompletedLoading && completedTasks.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <Loader size={24} className="text-text-accent animate-spin" />
          </div>
        )}

        {activeTab === 'active' && error && (
          <div className="text-center py-20">
            <p className="text-red-500">Failed to load tasks: {error}</p>
            <button
              onClick={() => fetchTasks(1)}
              className="mt-4 px-4 py-2 bg-button text-white text-sm font-medium rounded hover:bg-button-hover transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {activeTab === 'completed' && error && (
          <div className="text-center py-20">
            <p className="text-red-500">Failed to load completed tasks: {error}</p>
            <button
              onClick={() => fetchCompletedTasks(1)}
              className="mt-4 px-4 py-2 bg-button text-white text-sm font-medium rounded hover:bg-button-hover transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {(activeTab === 'active' ? !isLoading : !isCompletedLoading) && isEmpty && !error && (
          <div className="text-center py-20">
            <p className="text-text-secondary">
              {activeTab === 'active' ? "No pending tasks. You're all caught up!" : 'No completed tasks in the last 12 weeks.'}
            </p>
          </div>
        )}

        {!isEmpty && !error && (
          <div className="space-y-4">
            {listItems.map((assignment) => renderTaskRow(assignment, activeTab === 'completed'))}
          </div>
        )}

        {!isEmpty && !error && (
          <div ref={sentinelRef} className="h-4" />
        )}

        {(activeTab === 'active' ? isLoading : isCompletedLoading) && !isEmpty && (
          <div className="flex justify-center py-6">
            <Loader size={20} className="animate-spin text-text-accent" />
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
