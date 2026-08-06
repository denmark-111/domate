import { useState, useEffect, useCallback, useRef } from 'react';
import { taskService, listService, labelService } from '../../services/index.js';
import TaskModal from '../board/TaskModal.jsx';
import { Loader, CheckSquare, ChevronDown } from 'lucide-react';

const Tasks = () => {
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
  const [boardLists, setBoardLists] = useState([]);
  const [boardLabels, setBoardLabels] = useState([]);
  const [selectedWorkspaceFilter, setSelectedWorkspaceFilter] = useState('ALL');

  const scrollContainerRef = useRef(null);
  const sentinelRef = useRef(null);

  const fetchTasks = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    const res = await taskService.getMyTasks({ status: 'active', page, limit: 20 });
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
    const res = await taskService.getMyTasks({ status: 'completed', page, limit: 20, weeks: 12 });
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
    let isMounted = true;
    const loadInitialTasks = async () => {
      setIsLoading(true);
      setError(null);
      const res = await taskService.getMyTasks({ status: 'active', page: 1, limit: 20 });
      if (isMounted) {
        if (res.success) {
          setTasks(res.data);
          setActivePagination(res.pagination);
        } else {
          setError(res.error);
        }
        setIsLoading(false);
      }
    };
    loadInitialTasks();
    return () => { isMounted = false; };
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'completed' && completedTasks.length === 0) {
      fetchCompletedTasks(1);
    } else if (tab === 'active' && tasks.length === 0) {
      fetchTasks(1);
    }
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

  const handleToggleComplete = async (e, assignment) => {
    e.stopPropagation();
    const task = assignment.task;
    const newCompleted = activeTab === 'active';

    if (activeTab === 'active') {
      setTasks(prev => prev.filter(a => a.id !== assignment.id));
      setCompletedTasks(prev => [{ ...assignment, task: { ...task, completedAt: new Date().toISOString() } }, ...prev]);
    } else {
      setCompletedTasks(prev => prev.filter(a => a.id !== assignment.id));
      setTasks(prev => [{ ...assignment, task: { ...task, completedAt: null } }, ...prev]);
    }

    try {
      await taskService.updateTask(task.id, { completed: newCompleted });
    } catch {
      fetchTasks(1);
      fetchCompletedTasks(1);
    }
  };

  const dueLabel = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `Overdue (${Math.abs(diffDays)}d)`, urgent: true };
    if (diffDays === 0) return { text: 'Today', urgent: true };
    if (diffDays === 1) return { text: 'Tomorrow', urgent: false };
    if (diffDays <= 7) return { text: `In ${diffDays}d`, urgent: false };
    return { text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), urgent: false };
  };

  const listItems = activeTab === 'active' ? tasks : completedTasks;

  const availableWorkspaces = Array.from(
    new Set(
      listItems
        .map(a => a.task?.list?.board?.workspace?.name)
        .filter(Boolean)
    )
  );

  const filteredItems = listItems.filter(a => {
    if (selectedWorkspaceFilter === 'ALL') return true;
    return a.task?.list?.board?.workspace?.name === selectedWorkspaceFilter;
  });

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-surface dark:bg-background">
      <main className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-10 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-on-surface tracking-tight">
              Global Tasks
            </h1>
            <p className="font-body-md text-sm sm:text-base text-secondary mt-1">
              A consolidated view of all action items across active workspaces.
            </p>
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-surface-container-lowest border border-outline-variant p-3 sm:p-4 rounded-DEFAULT gap-4">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleTabChange('active')}
              className={`px-4 py-1.5 rounded-DEFAULT text-xs font-label-caps tracking-wider uppercase font-bold transition-colors flex-1 sm:flex-none text-center ${
                activeTab === 'active'
                  ? 'bg-primary text-on-primary border border-primary'
                  : 'bg-surface-container-lowest text-on-surface border border-outline-variant hover:border-primary'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleTabChange('completed')}
              className={`px-4 py-1.5 rounded-DEFAULT text-xs font-label-caps tracking-wider uppercase font-bold transition-colors flex-1 sm:flex-none text-center ${
                activeTab === 'completed'
                  ? 'bg-primary text-on-primary border border-primary'
                  : 'bg-surface-container-lowest text-on-surface border border-outline-variant hover:border-primary'
              }`}
            >
              Completed
            </button>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <select
                value={selectedWorkspaceFilter}
                onChange={(e) => setSelectedWorkspaceFilter(e.target.value)}
                className="w-full appearance-none bg-surface-container-lowest border border-outline-variant focus:border-primary focus:outline-none rounded-DEFAULT font-body-sm text-sm text-on-surface py-1.5 pl-3 pr-8 cursor-pointer"
              >
                <option value="ALL">All Workspaces</option>
                {availableWorkspaces.map(wsName => (
                  <option key={wsName} value={wsName}>{wsName}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Data Table (Task List) */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b-2 border-primary bg-surface-container-low font-label-caps text-xs text-on-surface uppercase font-bold items-center hidden md:grid">
            <div className="col-span-1 flex justify-center">Status</div>
            <div className="col-span-5">Task Name</div>
            <div className="col-span-3">Workspace</div>
            <div className="col-span-1">Board</div>
            <div className="col-span-2 text-right">Due Date</div>
          </div>

          {/* Task Rows */}
          {((activeTab === 'active' ? isLoading : isCompletedLoading) && filteredItems.length === 0) ? (
            <div className="flex items-center justify-center py-20">
              <Loader size={24} className="text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-error font-medium">Failed to load tasks: {error}</p>
              <button
                onClick={() => activeTab === 'active' ? fetchTasks(1) : fetchCompletedTasks(1)}
                className="mt-3 px-4 py-1.5 bg-primary text-on-primary text-xs font-semibold rounded-DEFAULT"
              >
                Retry
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 text-secondary font-body-sm text-sm">
              {activeTab === 'active' ? "No active tasks assigned to you!" : "No completed tasks found."}
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {filteredItems.map((assignment) => {
                const task = assignment.task;
                const due = dueLabel(task.dueDate);
                return (
                  <div
                    key={assignment.id}
                    onClick={() => openModal(assignment)}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-4 py-3.5 items-start md:items-center hover:bg-surface-container-low transition-colors group cursor-pointer"
                  >
                    {/* Status Checkbox */}
                    <div className="md:col-span-1 flex items-center gap-3 md:justify-center">
                      <button
                        type="button"
                        onClick={(e) => handleToggleComplete(e, assignment)}
                        className="w-5 h-5 border border-primary rounded-xs flex items-center justify-center hover:bg-surface-container-high transition-colors text-primary shrink-0"
                        title={activeTab === 'active' ? "Mark as complete" : "Mark as incomplete"}
                      >
                        {activeTab === 'completed' && <CheckSquare size={14} className="fill-primary text-on-primary" />}
                      </button>
                      <span className="md:hidden font-label-caps text-xs text-secondary uppercase font-bold">Status</span>
                    </div>

                    {/* Task Name */}
                    <div className="md:col-span-5 min-w-0">
                      <p className={`font-body-md text-sm font-medium ${
                        activeTab === 'completed' ? 'line-through text-secondary' : 'text-on-surface group-hover:underline decoration-1 underline-offset-2'
                      }`}>
                        {task.name}
                      </p>
                    </div>

                    {/* Workspace */}
                    <div className="md:col-span-3 flex items-center gap-2">
                      <span className="md:hidden font-label-caps text-xs text-secondary uppercase font-bold w-20">Workspace:</span>
                      <span className="bg-surface-container-highest px-2 py-0.5 rounded font-mono-label text-xs text-on-surface border border-outline-variant truncate">
                        {task.list?.board?.workspace?.name || 'Workspace'}
                      </span>
                    </div>

                    {/* Board / Label */}
                    <div className="md:col-span-1 flex items-center gap-2">
                      <span className="md:hidden font-label-caps text-xs text-secondary uppercase font-bold w-20">Board:</span>
                      <span className="text-xs text-secondary font-body-sm truncate">
                        {task.list?.board?.name || 'Board'}
                      </span>
                    </div>

                    {/* Due Date */}
                    <div className="md:col-span-2 flex items-center gap-2 md:justify-end">
                      <span className="md:hidden font-label-caps text-xs text-secondary uppercase font-bold w-20">Due:</span>
                      {due ? (
                        <span className={`font-body-sm text-xs font-medium px-2 py-0.5 rounded ${
                          due.urgent ? 'bg-error-container text-on-error-container border border-error' : 'text-secondary'
                        }`}>
                          {due.text}
                        </span>
                      ) : (
                        <span className="font-body-sm text-xs text-outline">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sentinel for infinite scrolling */}
        <div ref={sentinelRef} className="h-4" />

      </main>

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={closeModal}
        readOnly
        lists={boardLists}
        boardLabels={boardLabels}
        workspaceId={selectedTask?.list?.board?.workspace?.id}
      />
    </div>
  );
};

export default Tasks;
