import { useRef, useState, useEffect, startTransition } from 'react';
import {
  closestCenter,
  pointerWithin,
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
import BoardDetailModal from './BoardDetailModal';
import BoardLabelsModal from './BoardLabelsModal';
import ListColumn from './ListColumn';
import TaskCard from './TaskCard';
import DragOverlayCard from './DragOverlayCard';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { boardService, listService, taskService } from '../../services/index.js';
import { Info, Tag } from 'lucide-react';
import ActiveUsersBar from '../common/ActiveUsersBar';
import usePresenceRealtime from '../../hooks/usePresenceRealtime';

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

const customCollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  return closestCenter(args);
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
  const { user } = useAuth();
  const { activeUsers } = usePresenceRealtime(activeBoard?.id, user);
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
  const [isBoardLabelsOpen, setIsBoardLabelsOpen] = useState(false);
  const [boardLabels, setBoardLabels] = useState([]);

  useEffect(() => {
    setIsBoardDetailOpen(false);
    setIsBoardLabelsOpen(false);
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

    startTransition(() => {
      setData((currentData) => {
        const target = getTaskTarget(currentData, over);
        if (!target) return currentData;
        return moveTaskInLists(currentData, active.data.current.taskId, target.listId, target.position);
      });
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
    setIsBoardDetailOpen(true);
  };

  const closeBoardDetail = () => {
    setIsBoardDetailOpen(false);
  };

  const openBoardLabels = () => {
    setIsBoardLabelsOpen(true);
  };

  const closeBoardLabels = () => {
    setIsBoardLabelsOpen(false);
  };

  const handleUpdateBoard = async (boardId, payload) => {
    const res = await updateBoard(boardId, payload);
    if (res.success) {
      setActiveBoard(prev => prev?.id === boardId ? { ...prev, ...res.data } : prev);
    }
    return res;
  };

  return (
    <>
      <section className="flex-1 min-h-0 flex flex-col bg-bg-secondary">
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
                  <h1 className="text-lg font-bold text-text">{activeBoard?.name}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <ActiveUsersBar users={activeUsers} />
                  <button
                    onClick={openBoardLabels}
                    className="p-2 hover:bg-bg-tertiary rounded-lg text-text-secondary transition-colors"
                    title="Labels"
                  >
                    <Tag size={20} />
                  </button>
                  <button
                    onClick={openBoardDetail}
                    className="p-2 hover:bg-bg-tertiary rounded-lg text-text-secondary transition-colors"
                    title="Board Details"
                  >
                    <Info size={20} />
                  </button>
                </div>
              </div>
            <DndContext
              sensors={sensors}
              collisionDetection={customCollisionDetection}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragCancel={handleDragCancel}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 flex-1 min-h-0 p-3 overflow-x-auto">
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
                      className="w-full py-2 rounded-lg border border-dashed border-border text-text-secondary hover:text-text hover:border-text-secondary text-xs font-medium transition-colors"
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
                    <DragOverlayCard task={activeTask} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        )}
      </section>

      <BoardDetailModal
        isOpen={isBoardDetailOpen}
        onClose={closeBoardDetail}
        board={activeBoard}
        onUpdate={handleUpdateBoard}
      />

      <BoardLabelsModal
        isOpen={isBoardLabelsOpen}
        onClose={closeBoardLabels}
        boardId={activeBoard?.id}
        boardLabels={boardLabels}
        onLabelCreated={(label) => setBoardLabels(prev => [...prev, label])}
        onLabelUpdated={(label) => setBoardLabels(prev => prev.map(l => l.id === label.id ? label : l))}
        onLabelDeleted={(labelId) => setBoardLabels(prev => prev.filter(l => l.id !== labelId))}
      />

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