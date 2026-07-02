import { useRef, useState, useEffect } from 'react';
import {
  closestCenter,
  DndContext,
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
import { useWorkspace } from '../../context/WorkspaceContext';
import { boardService, listService, taskService } from '../../services/index.js';
import { Info } from 'lucide-react';

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
            const formattedLists = (res.data.lists || [])
              .sort((a, b) => a.position - b.position)
              .map((list) => ({
                id: list.id,
                title: list.name,
                position: list.position,
                tasks: (list.tasks || [])
                  .sort((a, b) => a.position - b.position)
                  .map((task) => ({ ...task, listId: list.id }))
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
      const newTask = res.data;
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

  const handleTaskUpdate = async (updatedTask) => {
    const payload = { 
      name: updatedTask.name || updatedTask.title, 
      description: updatedTask.description || '', 
      dueDate: updatedTask.dueDate || null 
    };
    if (updatedTask.attachments) {
      payload.attachments = updatedTask.attachments;
    }
    const res = await updateTask(updatedTask.id, payload);
    if (res.success) {
      setData((prevData) => prevData.map((column) => ({
        ...column,
        tasks: column.tasks.map((t) => (t.id === updatedTask.id ? res.data : t))
      })));
      setSelectedTask(res.data);
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

  const handleDragStart = ({ active }) => {
    dragStartData.current = data;
    activeDrag.current = active.data.current;
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
  };

  const handleDragEnd = async ({ active, over }) => {
    const previousData = dragStartData.current;
    const dragData = active.data.current || activeDrag.current;
    dragStartData.current = null;
    activeDrag.current = null;

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
    setBoardForm({ name: activeBoard?.name || '', description: activeBoard?.description || '' });
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
      const res = await updateBoard(activeBoard.id, boardForm);
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

  return (
    <>
      <section className="flex-1 min-h-0 flex flex-col overflow-x-auto overflow-y-auto bg-bg-secondary">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            Loading board...
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-3 border-b border-border flex-shrink-0">
              <h1 className="text-lg font-extrabold text-text">{activeBoard?.name}</h1>
              <button
                onClick={openBoardDetail}
                className="p-2 bg-bg hover:bg-bg-tertiary border border-border rounded-lg text-text transition-colors shadow-sm"
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
              <div className="flex gap-6 flex-1 min-h-0 p-4 pt-4">
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
                    />
                  ))}
                </SortableContext>

                {!showAddList ? (
                  <div className="w-80 flex-shrink-0">
                    <button
                      onClick={() => setShowAddList(true)}
                      className="w-full py-3 bg-bg-tertiary hover:bg-bg-tertiary rounded-lg border-2 border-dashed border-border text-text-secondary font-medium transition-colors"
                    >
                      + Add List
                    </button>
                  </div>
                ) : (
                  <AddListForm onSubmit={handleAddList} onCancel={() => setShowAddList(false)} />
                )}
              </div>
            </DndContext>
          </>
        )}
      </section>

      {isBoardDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onPointerDown={handleBoardDetailBackdropPointerDown}>
          <div className="bg-bg border border-border rounded-xl shadow-xl w-full max-w-lg mx-4">
            {!editingBoard ? (
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-text">{activeBoard?.name}</h2>
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
                  <button
                    onClick={closeBoardDetail}
                    className="px-4 py-2 bg-button-secondary text-button-secondary-text hover:bg-button-secondary-hover text-sm font-medium rounded transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveBoardFromModal} className="p-6 space-y-4">
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
          </div>
        </div>
      )}

      <TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onUpdate={handleTaskUpdate}
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