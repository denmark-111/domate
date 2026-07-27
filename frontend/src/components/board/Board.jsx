import { useRef, useState, useEffect, useCallback, startTransition } from 'react';
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
import useBoardRealtime from '../../hooks/useBoardRealtime';
import useBoardCursors from '../../hooks/useBoardCursors';
import LiveCursorsOverlay from './LiveCursorsOverlay';


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
  if (args.active?.data?.current?.type === 'list') {
    const listContainers = Array.from(args.droppableContainers.values()).filter(
      (c) => !c.disabled && c.data?.current?.type === 'list'
    );
    return closestCenter({
      ...args,
      droppableContainers: listContainers
    });
  }

  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    const taskCollision = pointerCollisions.find(
      (c) => c.data?.current?.type === 'task'
    );
    if (taskCollision) {
      return [taskCollision];
    }
    return pointerCollisions;
  }

  const { pointerCoordinates, droppableContainers, droppableRects } = args;
  if (pointerCoordinates) {
    const taskListContainers = Array.from(droppableContainers.values()).filter(
      (c) => !c.disabled && (c.data?.current?.type === 'task-list' || c.data?.current?.type === 'list')
    );

    let bestContainer = null;
    let minDistX = Infinity;

    for (const container of taskListContainers) {
      const rect = droppableRects.get(container.id);
      if (!rect) continue;

      const isHorizontallyWithin = pointerCoordinates.x >= rect.left && pointerCoordinates.x <= rect.right;
      const isBelowTop = pointerCoordinates.y >= rect.top;

      if (isHorizontallyWithin && isBelowTop) {
        return [{ id: container.id, data: container.data }];
      }

      if (isBelowTop) {
        const centerX = rect.left + rect.width / 2;
        const distX = Math.abs(pointerCoordinates.x - centerX);
        if (distX < minDistX) {
          minDistX = distX;
          bestContainer = container;
        }
      }
    }

    if (bestContainer) {
      return [{ id: bestContainer.id, data: bestContainer.data }];
    }
  }

  return closestCenter(args);
};

const moveTaskInLists = (lists, activeTaskId, overData) => {
  if (!activeTaskId || !overData) return lists;

  const activeLoc = findTaskLocation(lists, activeTaskId);
  if (!activeLoc) return lists;

  if (overData.type === 'task') {
    const overTaskId = overData.taskId;
    if (activeTaskId === overTaskId) return lists;

    const overLoc = findTaskLocation(lists, overTaskId);
    if (!overLoc) return lists;

    if (activeLoc.listIndex === overLoc.listIndex) {
      if (activeLoc.taskIndex === overLoc.taskIndex) return lists;

      const listIndex = activeLoc.listIndex;
      const reorderedTasks = arrayMove(
        lists[listIndex].tasks,
        activeLoc.taskIndex,
        overLoc.taskIndex
      );
      const nextLists = lists.map((col, idx) =>
        idx === listIndex ? { ...col, tasks: reorderedTasks } : col
      );
      return withPositions(nextLists);
    }

    const nextLists = lists.map((col) => ({ ...col, tasks: [...col.tasks] }));
    const [movedTask] = nextLists[activeLoc.listIndex].tasks.splice(activeLoc.taskIndex, 1);
    nextLists[overLoc.listIndex].tasks.splice(overLoc.taskIndex, 0, {
      ...movedTask,
      listId: lists[overLoc.listIndex].id
    });

    return withPositions(nextLists);
  }

  if (overData.type === 'task-list' || overData.type === 'list') {
    const targetListIndex = lists.findIndex((col) => col.id === overData.listId);
    if (targetListIndex === -1) return lists;

    const targetList = lists[targetListIndex];

    if (activeLoc.listIndex === targetListIndex) {
      const lastIndex = targetList.tasks.length - 1;
      if (activeLoc.taskIndex === lastIndex) return lists;

      const reorderedTasks = arrayMove(
        targetList.tasks,
        activeLoc.taskIndex,
        lastIndex
      );
      const nextLists = lists.map((col, idx) =>
        idx === targetListIndex ? { ...col, tasks: reorderedTasks } : col
      );
      return withPositions(nextLists);
    }

    const nextLists = lists.map((col) => ({ ...col, tasks: [...col.tasks] }));
    const [movedTask] = nextLists[activeLoc.listIndex].tasks.splice(activeLoc.taskIndex, 1);
    nextLists[targetListIndex].tasks.push({
      ...movedTask,
      listId: targetList.id
    });

    return withPositions(nextLists);
  }

  return lists;
};

const moveTaskToPosition = (lists, taskId, targetListId, targetPosition) => {
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
  const containerRef = useRef(null);
  const {
    activeDragCursors,
    lockedItems,
    handleMouseMove,
    broadcastDragStart,
    broadcastDragEnd
  } = useBoardCursors(activeBoard?.id, user, containerRef);

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

  const [realtimeCommentPayload, setRealtimeCommentPayload] = useState(null);
  const pendingEventsRef = useRef([]);


  const processRealtimeEvent = useCallback((event, payload) => {
    if (!payload) return;

    if (event === 'board:delete' || event === 'delete') {
      if (activeBoard?.id === payload.boardId) {
        setActiveBoard(null);
      }
      return;
    }

    if (event === 'board:update' || event === 'update') {
      setActiveBoard((prev) => (prev?.id === payload.id ? { ...prev, ...payload } : prev));
      return;
    }

    if (event === 'list:create' || event === 'board:list:create') {
      const newList = {
        id: payload.id,
        title: payload.name,
        position: payload.position,
        tasks: []
      };
      setData((prev) => {
        if (prev.some((col) => col.id === newList.id)) return prev;
        return [...prev, newList].sort((a, b) => a.position - b.position);
      });
      return;
    }

    if (event === 'list:update' || event === 'board:list:update') {
      setData((prev) => {
        const oldIndex = prev.findIndex((col) => col.id === payload.id);
        if (oldIndex === -1) return prev;

        const updatedCol = {
          ...prev[oldIndex],
          title: payload.name ?? prev[oldIndex].title,
          position: payload.position ?? prev[oldIndex].position
        };

        const targetPos = payload.position;
        if (targetPos !== undefined && targetPos !== oldIndex && targetPos >= 0 && targetPos < prev.length) {
          const nextLists = prev.map((col, idx) => (idx === oldIndex ? updatedCol : col));
          return withPositions(arrayMove(nextLists, oldIndex, targetPos));
        }

        return prev.map((col) => (col.id === payload.id ? updatedCol : col));
      });
      return;
    }

    if (event === 'list:delete' || event === 'board:list:delete') {
      setData((prev) => prev.filter((col) => col.id !== payload.listId));
      return;
    }

    if (event === 'task:create' || event === 'board:task:create') {
      const newTask = normalizeTask(payload);
      setData((prev) =>
        prev.map((col) => {
          if (col.id === newTask.listId) {
            if (col.tasks.some((t) => t.id === newTask.id)) return col;
            return {
              ...col,
              tasks: [...col.tasks, newTask].sort((a, b) => a.position - b.position)
            };
          }
          return col;
        })
      );
      return;
    }

    if (event === 'task:update' || event === 'board:task:update') {
      const updated = normalizeTask(payload);
      setData((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
        }))
      );
      setSelectedTask((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
      return;
    }

    if (event === 'task:move' || event === 'board:task:move') {
      const moved = normalizeTask(payload);
      setData((prev) => {
        const next = moveTaskToPosition(prev, moved.id, moved.listId, moved.position);
        return next.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => (t.id === moved.id ? { ...t, ...moved } : t))
        }));
      });
      setSelectedTask((prev) =>
        prev?.id === moved.id ? { ...prev, listId: moved.listId, position: moved.position } : prev
      );
      return;
    }

    if (event === 'task:delete' || event === 'board:task:delete') {
      setData((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== payload.taskId)
        }))
      );
      setSelectedTask((prev) => {
        if (prev?.id === payload.taskId) {
          setIsTaskModalOpen(false);
          return null;
        }
        return prev;
      });
      return;
    }

    if (event === 'task:assign' || event === 'board:task:assign') {
      const { taskId, assignments } = payload;
      setData((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => (t.id === taskId ? { ...t, assignments } : t))
        }))
      );
      setSelectedTask((prev) => (prev?.id === taskId ? { ...prev, assignments } : prev));
      return;
    }

    if (event === 'task:label' || event === 'board:task:label') {
      const { taskId, taskLabels } = payload;
      const labels = (taskLabels || []).map((tl) => tl.boardLabel);
      setData((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => (t.id === taskId ? { ...t, taskLabels, labels } : t))
        }))
      );
      setSelectedTask((prev) => (prev?.id === taskId ? { ...prev, taskLabels, labels } : prev));
      return;
    }

    if (event === 'label:change' || event === 'board:label:change') {
      if (activeBoard?.id) {
        boardService.getBoardById(activeBoard.id).then((res) => {
          if (res.success && res.data) {
            setBoardLabels(res.data.labels || []);
          }
        });
      }
      return;
    }

    if (event === 'task:comment' || event === 'board:task:comment') {
      const { taskId, action, comment, commentId } = payload;
      setData((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => {
            if (t.id === taskId) {
              const currentCount = t._count?.comments || 0;
              const newCount = action === 'create' ? currentCount + 1 : Math.max(0, currentCount - 1);
              return { ...t, _count: { ...t._count, comments: newCount } };
            }
            return t;
          })
        }))
      );
      setSelectedTask((prev) => {
        if (prev?.id === taskId) {
          const currentCount = prev._count?.comments || 0;
          const newCount = action === 'create' ? currentCount + 1 : Math.max(0, currentCount - 1);
          return { ...prev, _count: { ...prev._count, comments: newCount } };
        }
        return prev;
      });
      setRealtimeCommentPayload({ taskId, action, comment, commentId, timestamp: Date.now() });
      return;
    }
  }, [activeBoard?.id, setActiveBoard]);



  const flushPendingEvents = useCallback(() => {
    if (pendingEventsRef.current.length > 0) {
      const queue = [...pendingEventsRef.current];
      pendingEventsRef.current = [];
      queue.forEach(({ event, payload }) => {
        processRealtimeEvent(event, payload);
      });
    }
  }, [processRealtimeEvent]);

  const handleRealtimeEvent = useCallback((event, payload) => {
    if (activeDrag.current !== null) {
      pendingEventsRef.current.push({ event, payload });
    } else {
      processRealtimeEvent(event, payload);
    }
  }, [processRealtimeEvent]);

  useBoardRealtime(activeBoard?.id, handleRealtimeEvent);


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
      setSelectedTask((prev) => (prev?.id === updatedTask.id ? normalized : prev));
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
      setSelectedTask((prev) => (prev?.id === taskId ? normalized : prev));
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
    const current = active.data.current;
    const rectObj = active.rect.current?.translated || active.rect.current?.initial;
    const initialPos = rectObj
      ? { x: rectObj.left ?? rectObj.x ?? 0, y: rectObj.top ?? rectObj.y ?? 0 }
      : null;
    if (current?.type === 'task') {
      setActiveTask(findTaskById(current.taskId));
      broadcastDragStart('task', current.taskId, initialPos);
    } else if (current?.type === 'list') {
      broadcastDragStart('list', current.listId, initialPos);
    }
  };

  const handleDragOver = ({ active, over }) => {
    if (!over || active.data.current?.type !== 'task') return;

    const activeTaskId = active.data.current?.taskId;
    const overData = over.data?.current;

    if (!activeTaskId || !overData) return;

    startTransition(() => {
      setData((currentData) => moveTaskInLists(currentData, activeTaskId, overData));
    });
  };

  const handleDragCancel = () => {
    if (activeDrag.current) {
      const current = activeDrag.current;
      broadcastDragEnd(current.type, current.taskId || current.listId);
    }
    if (dragStartData.current) {
      setData(dragStartData.current);
    }
    dragStartData.current = null;
    activeDrag.current = null;
    setActiveTask(null);
    flushPendingEvents();
  };

  const handleDragEnd = async ({ active, over }) => {
    const previousData = dragStartData.current;
    const dragData = active.data.current || activeDrag.current;
    if (dragData) {
      broadcastDragEnd(dragData.type, dragData.taskId || dragData.listId);
    }
    dragStartData.current = null;
    activeDrag.current = null;
    setActiveTask(null);
    flushPendingEvents();

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
              <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3">
                  {activeBoard?.color && (
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: activeBoard.color }}
                    />
                  )}
                  <h1 className="text-base sm:text-lg font-bold text-text truncate">{activeBoard?.name}</h1>
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
              <div
                ref={containerRef}
                onMouseMove={handleMouseMove}
                className="relative flex items-start gap-3 sm:gap-4 flex-1 min-h-0 pt-3.5 pb-2 px-2 sm:pt-4 sm:pb-3 sm:px-3 overflow-x-auto"
              >
                <LiveCursorsOverlay cursors={activeDragCursors} />
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
                      lockInfo={lockedItems[col.id]}
                      taskLockMap={lockedItems}
                    />
                  ))}
                </SortableContext>

                {!showAddList ? (
                  <div className="w-72 sm:w-80 flex-shrink-0">
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
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onUpdate={handleTaskUpdate}
        lists={data}
        boardLabels={boardLabels}
        onBoardLabelCreated={(label) => setBoardLabels(prev => [...prev, label])}
        onMoveTask={handleMoveTaskToList}
        realtimeCommentPayload={realtimeCommentPayload}
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