import { useRef, useState, useEffect } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import AddListForm from './AddListForm';
import TaskModal from './TaskModal';
import ListColumn from './ListColumn';
import TaskCard from './TaskCard';
import { useWorkspace } from '../../context/WorkspaceContext';
import { boardService, listService, taskService, labelService } from '../../services/index.js';
import { Info, Tag, Plus, X, Check, Pencil } from 'lucide-react';
import ColorPicker from '../common/ColorPicker';
import { BOARD_COLORS } from '../../data/colorPalette';

const LABEL_COLORS = [
  '#61BD4F', '#F2D600', '#FF9F1A', '#EB5A46',
  '#C377E0', '#0079BF', '#00C2E0', '#51E898',
  '#FF78CB', '#B3BAC5',
];

const listSortableId = (listId) => `list:${listId}`;
const taskSortableId = (taskId) => `task:${taskId}`;
const taskListDroppableId = (listId) => `task-list:${listId}`;

const withPositions = (lists) =>
  lists.map((list, listIndex) => ({
    ...list,
    position: listIndex,
    tasks: list.tasks.map((task, taskIndex) => ({
      ...task,
      listId: list.id,
      position: taskIndex
    }))
  }));

const findTaskLocation = (lists, taskId) => {
  for (const [listIndex, list] of lists.entries()) {
    const taskIndex = list.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex !== -1) return { listIndex, taskIndex };
  }
  return null;
};

const getTaskTarget = (lists, over) => {
  const overData = over?.data?.current;
  if (!overData) return null;

  if (overData.type === 'task') {
    const location = findTaskLocation(lists, overData.taskId);
    if (!location) return null;
    return {
      listId: lists[location.listIndex].id,
      position: location.taskIndex
    };
  }

  if (overData.type === 'task-list' || overData.type === 'list') {
    const list = lists.find((item) => item.id === overData.listId);
    if (!list) return null;
    return { listId: list.id, position: list.tasks.length };
  }

  return null;
};

const getListTargetId = (lists, over) => {
  const overData = over?.data?.current;
  if (!overData) return null;

  if (overData.type === 'list' || overData.type === 'task-list') return overData.listId;

  if (overData.type === 'task') {
    const location = findTaskLocation(lists, overData.taskId);
    return location ? lists[location.listIndex].id : null;
  }

  return null;
};

const moveTaskInLists = (lists, taskId, targetListId, targetPosition) => {
  const source = findTaskLocation(lists, taskId);
  const targetListIndex = lists.findIndex((list) => list.id === targetListId);
  if (!source || targetListIndex === -1) return lists;

  const sourceList = lists[source.listIndex];
  const targetList = lists[targetListIndex];
  const maxPosition = targetList.tasks.length - (sourceList.id === targetListId ? 1 : 0);
  const position = Math.max(0, Math.min(targetPosition, maxPosition));

  if (sourceList.id === targetListId && source.taskIndex === position) return lists;

  const nextLists = lists.map((list) => ({ ...list, tasks: [...list.tasks] }));
  const [movedTask] = nextLists[source.listIndex].tasks.splice(source.taskIndex, 1);
  nextLists[targetListIndex].tasks.splice(position, 0, { ...movedTask, listId: targetListId });

  return withPositions(nextLists);
};

const Board = () => {
  const { activeBoard, setActiveBoard, updateTask, deleteTask, moveTask, updateList, deleteList, updateBoard } = useWorkspace();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const dragStartData = useRef(null);
  const activeDrag = useRef(null);
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  useEffect(() => {
    const fetchBoardData = async () => {
      if (activeBoard?.id) {
        setIsLoading(true);
        try {
          const res = await boardService.getBoardById(activeBoard.id);
          if (res.success && res.data) {
            setBoardLabels(res.data.labels || []);
            const formattedLists = (res.data.lists || [])
              .sort((a, b) => a.position - b.position)
              .map((list) => ({
                id: list.id,
                title: list.name,
                position: list.position,
                tasks: (list.tasks || [])
                  .sort((a, b) => a.position - b.position)
                  .map((task) => ({
                    ...task,
                    listId: list.id,
                    labels: (task.taskLabels || []).map(tl => tl.boardLabel)
                  }))
              }));
            setData(formattedLists);
          } else {
            setData([]);
          }
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchBoardData();
  }, [activeBoard?.id]);

  const [addingTaskIn, setAddingTaskIn] = useState(null);
  const [showAddList, setShowAddList] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isBoardDetailOpen, setIsBoardDetailOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState(false);
  const [boardForm, setBoardForm] = useState({ name: '', description: '' });
  const [isSavingBoard, setIsSavingBoard] = useState(false);
  const [boardError, setBoardError] = useState('');
  const [boardDetailTab, setBoardDetailTab] = useState('details');

  // Label management state
  const [boardLabels, setBoardLabels] = useState([]);
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [editLabelName, setEditLabelName] = useState('');
  const [editLabelColor, setEditLabelColor] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [showNewLabelForm, setShowNewLabelForm] = useState(false);
  const [isSavingLabel, setIsSavingLabel] = useState(false);

  useEffect(() => {
    setEditingBoard(false);
    setBoardError('');
    setIsBoardDetailOpen(false);
  }, [activeBoard?.id]);

  const handleAddTask = (listId) => {
    setAddingTaskIn(listId);
  };

  const handleCancelAddTask = () => {
    setAddingTaskIn(null);
  };

  const handleSubmitTask = async (listId, taskData) => {
    const res = await taskService.createTask(listId, { name: taskData.title, description: '' });
    if (res.success) {
      const newTask = normalizeTask(res.data);
      setData((prevData) =>
        prevData.map((col) => {
          if (col.id === listId) {
            return {
              ...col,
              tasks: [...col.tasks, newTask].sort((a, b) => a.position - b.position)
            };
          }
          return col;
        })
      );
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const normalizeTask = (task) => ({
    ...task,
    labels: (task.taskLabels || []).map(tl => tl.boardLabel)
  });

  const handleTaskUpdate = async (updatedTask) => {
    const payload = { 
      name: updatedTask.name || updatedTask.title, 
      description: updatedTask.description || '', 
      dueDate: updatedTask.dueDate || null,
      completed: !!updatedTask.completedAt
    };
    if (updatedTask.attachments) {
      payload.attachments = updatedTask.attachments;
    }
    const res = await updateTask(updatedTask.id, payload);
    if (res.success) {
      const normalized = normalizeTask(res.data);
      setData((prevData) => prevData.map((column) => ({
        ...column,
        tasks: column.tasks.map((t) => (t.id === updatedTask.id ? normalized : t))
      })));
      setSelectedTask(normalized);
    }
  };

  const handleToggleComplete = async (taskId, completedAt) => {
    let prevCompletedAt = null;
    setData((prevData) => {
      const snapshot = { completedAt: null };
      const next = prevData.map((column) => ({
        ...column,
        tasks: column.tasks.map((t) => {
          if (t.id === taskId) {
            snapshot.completedAt = t.completedAt;
            return { ...t, completedAt };
          }
          return t;
        })
      }));
      prevCompletedAt = snapshot.completedAt;
      return next;
    });
    setSelectedTask((prev) => prev?.id === taskId ? { ...prev, completedAt } : prev);
    const res = await updateTask(taskId, { completed: !!completedAt });
    if (res.success) {
      const normalized = normalizeTask(res.data);
      setData((prevData) => prevData.map((column) => ({
        ...column,
        tasks: column.tasks.map((t) =>
          t.id === taskId ? normalized : t
        )
      })));
      setSelectedTask(normalized);
    } else {
      setData((prevData) => prevData.map((column) => ({
        ...column,
        tasks: column.tasks.map((t) =>
          t.id === taskId ? { ...t, completedAt: prevCompletedAt } : t
        )
      })));
      setSelectedTask((prev) => prev?.id === taskId ? { ...prev, completedAt: prevCompletedAt } : prev);
    }
  };

  const handleMoveTaskToList = async (taskId, targetListId) => {
    let prevSnapshot = null;
    setData((prevData) => {
      prevSnapshot = prevData.map((col) => ({ ...col, tasks: [...col.tasks] }));
      return prevData.map((col) => {
        if (col.id === targetListId) {
          const taskToMove = prevData.flatMap((c) => c.tasks).find((t) => t.id === taskId);
          if (!taskToMove) return col;
          const moved = { ...taskToMove, listId: targetListId, position: col.tasks.length };
          return { ...col, tasks: [...col.tasks, moved] };
        }
        return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
      });
    });
    setSelectedTask((prev) => prev?.id === taskId ? { ...prev, listId: targetListId } : prev);
    const targetList = data.find((col) => col.id === targetListId);
    const position = targetList ? targetList.tasks.length : 0;
    const res = await moveTask(taskId, { listId: targetListId, position });
    if (!res.success) {
      if (prevSnapshot) setData(prevSnapshot);
    }
  };

  const handleAddList = async (listData) => {
    if (!activeBoard?.id) return;
    const res = await listService.createList(activeBoard.id, { name: listData.title });
    if (res.success) {
      const newList = {
        id: res.data.id,
        title: res.data.name,
        position: res.data.position,
        tasks: []
      };
      setData((prevData) => [...prevData, newList].sort((a, b) => a.position - b.position));
      setShowAddList(false);
    }
  };

  const handleSaveList = async (listId, newTitle) => {
    const res = await updateList(listId, { name: newTitle });
    if (res.success) {
      setData((prev) => prev.map((col) => (col.id === listId ? { ...col, title: newTitle } : col)));
    }
  };

  const findTaskById = (taskId) => {
    for (const list of data) {
      const task = list.tasks.find((t) => t.id === taskId);
      if (task) return task;
    }
    return null;
  };

  const handleDragStart = ({ active }) => {
    dragStartData.current = data;
    activeDrag.current = active.data.current;
    if (active.data.current?.type === 'task') {
      setActiveTask(findTaskById(active.data.current.taskId));
    }
  };

  const handleDragOver = ({ active, over }) => {
    if (!over || active.data.current?.type !== 'task') return;

    setData((currentData) => {
      const target = getTaskTarget(currentData, over);
      if (!target) return currentData;
      return moveTaskInLists(currentData, active.data.current.taskId, target.listId, target.position);
    });
  };

  const handleDragCancel = () => {
    if (dragStartData.current) {
      setData(dragStartData.current);
    }
    dragStartData.current = null;
    activeDrag.current = null;
    setActiveTask(null);
  };

  const handleDragEnd = async ({ active, over }) => {
    const previousData = dragStartData.current;
    const dragData = active.data.current || activeDrag.current;
    dragStartData.current = null;
    activeDrag.current = null;
    setActiveTask(null);

    if (!previousData || !dragData) return;
    if (!over) {
      setData(previousData);
      return;
    }

    if (dragData.type === 'list') {
      const targetListId = getListTargetId(data, over);
      const oldIndex = data.findIndex((list) => list.id === dragData.listId);
      const newIndex = data.findIndex((list) => list.id === targetListId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const nextData = withPositions(arrayMove(data, oldIndex, newIndex));
      setData(nextData);
      const res = await updateList(dragData.listId, { position: newIndex });
      if (!res.success) {
        setData(previousData);
      }
      return;
    }

    if (dragData.type === 'task') {
      const location = findTaskLocation(data, dragData.taskId);
      if (!location) return;

      const previousLocation = findTaskLocation(previousData, dragData.taskId);
      if (
        previousLocation &&
        previousData[previousLocation.listIndex].id === data[location.listIndex].id &&
        previousLocation.taskIndex === location.taskIndex
      ) {
        return;
      }

      const targetList = data[location.listIndex];
      const res = await moveTask(dragData.taskId, {
        listId: targetList.id,
        position: location.taskIndex
      });
      if (!res.success) {
        setData(previousData);
      }
    }
  };

  const openBoardDetail = () => {
    setBoardForm({ name: activeBoard?.name || '', description: activeBoard?.description || '', color: activeBoard?.color || '' });
    setEditingBoard(false);
    setBoardError('');
    setIsBoardDetailOpen(true);
  };

  const closeBoardDetail = () => {
    setIsBoardDetailOpen(false);
    setEditingBoard(false);
    setBoardError('');
  };

  const handleBoardDetailBackdropPointerDown = (e) => {
    if (e.target === e.currentTarget) {
      closeBoardDetail();
    }
  };

  const handleSaveBoardFromModal = async (e) => {
    e.preventDefault();
    if (!boardForm.name.trim()) {
      setBoardError('Board name is required');
      return;
    }
    setIsSavingBoard(true);
    try {
      const payload = { name: boardForm.name, description: boardForm.description };
      if (boardForm.color) payload.color = boardForm.color;
      const res = await updateBoard(activeBoard.id, payload);
      if (res.success) {
        setActiveBoard({ ...activeBoard, ...res.data });
        setIsBoardDetailOpen(false);
        setEditingBoard(false);
      } else {
        setBoardError(res.error || 'Failed to update board');
      }
    } catch {
      setBoardError('Failed to update board');
    } finally {
      setIsSavingBoard(false);
    }
  };

  // Label CRUD handlers
  const handleCreateLabel = async (e) => {
    e.preventDefault();
    if (!newLabelName.trim() || !activeBoard?.id) return;
    setIsSavingLabel(true);
    const res = await labelService.createBoardLabel(activeBoard.id, {
      name: newLabelName.trim(),
      color: newLabelColor,
    });
    if (res.success) {
      setBoardLabels(prev => [...prev, res.data]);
      setNewLabelName('');
      setNewLabelColor(LABEL_COLORS[0]);
      setShowNewLabelForm(false);
    }
    setIsSavingLabel(false);
  };

  const handleStartEditLabel = (label) => {
    setEditingLabelId(label.id);
    setEditLabelName(label.name);
    setEditLabelColor(label.color);
  };

  const handleSaveEditLabel = async (labelId) => {
    if (!editLabelName.trim() || !activeBoard?.id) return;
    setIsSavingLabel(true);
    const res = await labelService.updateBoardLabel(activeBoard.id, labelId, {
      name: editLabelName.trim(),
      color: editLabelColor,
    });
    if (res.success) {
      setBoardLabels(prev => prev.map(l => l.id === labelId ? res.data : l));
      setEditingLabelId(null);
    }
    setIsSavingLabel(false);
  };

  const handleDeleteLabel = async (labelId) => {
    if (!activeBoard?.id) return;
    const res = await labelService.deleteBoardLabel(activeBoard.id, labelId);
    if (res.success) {
      setBoardLabels(prev => prev.filter(l => l.id !== labelId));
    }
  };

  return (
    <>
      <section className="flex-1 min-h-0 flex flex-col overflow-x-auto bg-bg-secondary">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            Loading board...
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-2.5 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                {activeBoard?.color && (
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: activeBoard.color }}
                  />
                )}
                <h1 className="text-lg font-extrabold text-text">{activeBoard?.name}</h1>
              </div>
              <button
                onClick={openBoardDetail}
                className="p-2 hover:bg-bg-tertiary rounded-lg text-text-secondary transition-colors"
                title="Board Details"
              >
                <Info size={20} />
              </button>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragCancel={handleDragCancel}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 flex-1 min-h-0 p-3">
                <SortableContext items={data.map((col) => listSortableId(col.id))} strategy={horizontalListSortingStrategy}>
                  {data.map((col) => (
                    <ListColumn
                      key={col.id || col.title}
                      id={col.id}
                      title={col.title}
                      tasks={col.tasks}
                      listSortableId={listSortableId(col.id)}
                      taskSortableId={taskSortableId}
                      taskListDroppableId={taskListDroppableId(col.id)}
                      onAddTask={handleAddTask}
                      isAddingTask={addingTaskIn === col.id}
                      onCancelAddTask={handleCancelAddTask}
                      onTaskClick={handleTaskClick}
                      onSubmitTask={handleSubmitTask}
                      onDeleteList={async (listId) => {
                        try {
                          await deleteList(listId);
                          setData((prev) => prev.filter((c) => c.id !== listId));
                        } catch {
                          // Keep UI state in sync if deletion fails
                        }
                      }}
                      onDeleteTask={async (taskId) => {
                        try {
                          await deleteTask(taskId);
                          setData((prevData) =>
                            prevData.map((col) => ({
                              ...col,
                              tasks: col.tasks.filter((t) => t.id !== taskId)
                            }))
                          );
                        } catch {
                          // Keep UI state in sync if deletion fails
                        }
                      }}
                      onSaveList={handleSaveList}
                      onToggleComplete={handleToggleComplete}
                    />
                  ))}
                </SortableContext>

                {!showAddList ? (
                  <div className="w-80 flex-shrink-0">
                    <button
                      onClick={() => setShowAddList(true)}
                      className="w-full py-2 rounded-xl border border-dashed border-border text-text-secondary hover:text-text hover:border-text-secondary text-xs font-medium transition-colors"
                    >
                      + Add List
                    </button>
                  </div>
                ) : (
                  <AddListForm onSubmit={handleAddList} onCancel={() => setShowAddList(false)} />
                )}
              </div>

              <DragOverlay dropAnimation={null}>
                {activeTask ? (
                  <div className="opacity-85 rotate-3">
                    <TaskCard
                      task={activeTask}
                      sortableId={`overlay-${activeTask.id}`}
                      onClick={() => {}}
                      onDelete={() => {}}
                      onToggleComplete={() => {}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        )}
      </section>

      {isBoardDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onPointerDown={handleBoardDetailBackdropPointerDown}>
          <div className="bg-bg border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            {/* Tab bar */}
            <div className="flex border-b border-border shrink-0">
              <button
                onClick={() => setBoardDetailTab('details')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  boardDetailTab === 'details'
                    ? 'text-text border-b-2 border-accent'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setBoardDetailTab('labels')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  boardDetailTab === 'labels'
                    ? 'text-text border-b-2 border-accent'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                Labels
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {boardDetailTab === 'details' && (
                <>
                  {!editingBoard ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        {activeBoard?.color && (
                          <span
                            className="w-4 h-4 rounded-full shrink-0"
                            style={{ backgroundColor: activeBoard.color }}
                          />
                        )}
                        <h2 className="text-xl font-extrabold text-text">{activeBoard?.name}</h2>
                      </div>
                      <div>
                        {activeBoard?.description ? (
                          <p className="mt-2 text-sm text-text-secondary whitespace-pre-wrap">{activeBoard.description}</p>
                        ) : (
                          <p className="mt-2 text-sm text-text-tertiary italic">No description provided</p>
                        )}
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setEditingBoard(true)}
                          className="px-4 py-2 bg-button hover:bg-button-hover text-white text-sm font-medium rounded transition-colors"
                        >
                          Edit Details
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveBoardFromModal} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Board Name</label>
                        <input
                          type="text"
                          value={boardForm.name}
                          onChange={(e) => setBoardForm((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full text-lg font-extrabold text-text bg-bg-tertiary px-3 py-2 rounded border border-input-border outline-none focus:border-input-border-focus"
                          placeholder="Board name"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Color</label>
                        <ColorPicker
                          colors={BOARD_COLORS}
                          selectedColor={boardForm.color || BOARD_COLORS[0]}
                          onChange={(color) => setBoardForm((prev) => ({ ...prev, color }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                        <textarea
                          value={boardForm.description}
                          onChange={(e) => setBoardForm((prev) => ({ ...prev, description: e.target.value }))}
                          rows="4"
                          className="w-full px-3 py-2 rounded border border-input-border bg-bg-tertiary text-sm text-text outline-none focus:border-input-border-focus resize-none"
                          placeholder="Board description"
                        />
                      </div>
                      {boardError && (
                        <div className="p-2 bg-error-bg border border-error-border rounded text-sm text-error-text">
                          {boardError}
                        </div>
                      )}
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={isSavingBoard}
                          className="px-4 py-2 bg-button hover:bg-button-hover text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
                        >
                          {isSavingBoard ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBoard(false);
                            setBoardError('');
                          }}
                          className="px-4 py-2 bg-button-secondary text-button-secondary-text hover:bg-button-secondary-hover text-sm font-medium rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {boardDetailTab === 'labels' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-text">Board Labels</h3>
                    <button
                      onClick={() => setShowNewLabelForm(!showNewLabelForm)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-button hover:bg-button-hover text-white text-sm font-medium rounded transition-colors"
                    >
                      <Plus size={14} />
                      Add Label
                    </button>
                  </div>

                  {/* New label form */}
                  {showNewLabelForm && (
                    <form onSubmit={handleCreateLabel} className="p-3 bg-bg-tertiary rounded-lg border border-border space-y-3">
                      <input
                        type="text"
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        placeholder="Label name"
                        className="w-full px-3 py-2 rounded border border-input-border bg-bg text-sm text-text outline-none focus:border-input-border-focus"
                        autoFocus
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {LABEL_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewLabelColor(color)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              newLabelColor === color ? 'border-white scale-110 ring-2 ring-accent' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isSavingLabel || !newLabelName.trim()}
                          className="px-3 py-1.5 bg-button hover:bg-button-hover text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                        >
                          {isSavingLabel ? 'Adding...' : 'Add'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewLabelForm(false);
                            setNewLabelName('');
                          }}
                          className="px-3 py-1.5 bg-button-secondary text-button-secondary-text hover:bg-button-secondary-hover text-xs font-medium rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Existing labels */}
                  {boardLabels.length === 0 && !showNewLabelForm && (
                    <p className="text-sm text-text-secondary text-center py-8">No labels yet. Add one to get started.</p>
                  )}
                  <div className="space-y-2">
                    {boardLabels.map((label) => (
                      <div
                        key={label.id}
                        className="flex items-center gap-3 p-2 rounded-lg border border-border bg-bg-secondary"
                      >
                        {editingLabelId === label.id ? (
                          <>
                            <input
                              type="text"
                              value={editLabelName}
                              onChange={(e) => setEditLabelName(e.target.value)}
                              className="flex-1 px-2 py-1 rounded border border-input-border bg-bg text-sm text-text outline-none focus:border-input-border-focus"
                              autoFocus
                            />
                            <div className="flex gap-1">
                              {LABEL_COLORS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => setEditLabelColor(color)}
                                  className={`w-5 h-5 rounded-full border transition-all ${
                                    editLabelColor === color ? 'border-white scale-110 ring-2 ring-accent' : 'border-transparent'
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <button
                              onClick={() => handleSaveEditLabel(label.id)}
                              disabled={isSavingLabel || !editLabelName.trim()}
                              className="p-1 text-green-500 hover:text-green-600 transition-colors disabled:opacity-50"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingLabelId(null)}
                              className="p-1 text-text-secondary hover:text-text transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span
                              className="w-4 h-4 rounded shrink-0"
                              style={{ backgroundColor: label.color }}
                            />
                            <span className="flex-1 text-sm text-text">{label.name}</span>
                            <button
                              onClick={() => handleStartEditLabel(label)}
                              className="p-1 text-text-secondary hover:text-text transition-colors"
                              title="Edit label"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteLabel(label.id)}
                              className="p-1 text-text-secondary hover:text-red-500 transition-colors"
                              title="Delete label"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t border-border shrink-0">
              <button
                onClick={closeBoardDetail}
                className="px-4 py-2 bg-button-secondary text-button-secondary-text hover:bg-button-secondary-hover text-sm font-medium rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onUpdate={handleTaskUpdate}
        lists={data}
        boardLabels={boardLabels}
        onBoardLabelCreated={(label) => setBoardLabels(prev => [...prev, label])}
        onMoveTask={handleMoveTaskToList}
        onCommentChange={(taskId, delta) => {
          setData((prevData) =>
            prevData.map((column) => ({
              ...column,
              tasks: column.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, _count: { comments: (t._count?.comments ?? 0) + delta } }
                  : t
              )
            }))
          );
          if (selectedTask?.id === taskId) {
            setSelectedTask((prev) => prev ? { ...prev, _count: { comments: (prev._count?.comments ?? 0) + delta } } : prev);
          }
        }}
      />
    </>
  );
};

export default Board;