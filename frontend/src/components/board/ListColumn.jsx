import { useState, useRef, useEffect, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';
import AddTaskForm from './AddTaskForm';
import ConfirmModal from '../common/ConfirmModal';
import { GripVertical, Trash2, Plus } from 'lucide-react';

const ListColumn = ({
  id,
  title,
  tasks,
  totalTaskCount,
  isFiltered,
  listSortableId,
  taskSortableId,
  taskListDroppableId,
  onAddTask,
  isAddingTask,
  onCancelAddTask,
  onTaskClick,
  onSubmitTask,
  onDeleteList,
  onDeleteTask,
  onSaveList,
  onToggleComplete,
  lockInfo,
  taskLockMap
}) => {
  const [showDeleteList, setShowDeleteList] = useState(false);
  const [isDeletingList, setIsDeletingList] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isLockedByOther = !!lockInfo;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: listSortableId,
    data: { type: 'list', listId: id },
    disabled: isLockedByOther
  });
  const { setNodeRef: setTasksNodeRef, isOver } = useDroppable({
    id: taskListDroppableId,
    data: { type: 'task-list', listId: id }
  });

  // Combined ref: merge the droppable ref onto our scroll container ref
  const setCombinedRef = useCallback((node) => {
    setTasksNodeRef(node);
    scrollContainerRef.current = node;
  }, [setTasksNodeRef]);

  // Auto-scroll to bottom when adding a task
  useEffect(() => {
    if (isAddingTask && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [isAddingTask]);

  const handleDeleteList = async () => {
    setIsDeletingList(true);
    try {
      await onDeleteList(id);
    } finally {
      setIsDeletingList(false);
      setShowDeleteList(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveEdit = async () => {
    if (editValue.trim() && editValue !== title) {
      await onSaveList(id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        borderColor: lockInfo ? lockInfo.color : undefined
      }}
      className={`w-72 sm:w-80 flex-shrink-0 flex flex-col max-h-full bg-surface-container-low border border-outline-variant rounded-DEFAULT overflow-hidden relative transition-all shadow-2xs ${
        lockInfo ? 'border-2 shadow-md z-10' : ''
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      {lockInfo && (
        <div
          className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-DEFAULT text-white font-mono-label text-[9px] font-bold shadow-sm z-20 pointer-events-none"
          style={{ backgroundColor: lockInfo.color }}
        >
          Moving List: {lockInfo.fullName}
        </div>
      )}

      {/* Column Header */}
      <div className="flex items-center justify-between px-3.5 py-3 group/list bg-transparent">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            className={`cursor-grab active:cursor-grabbing text-secondary hover:text-on-surface transition-colors flex-shrink-0 ${
              isLockedByOther ? 'cursor-not-allowed opacity-50' : ''
            }`}
            title={isLockedByOther ? `Locked by ${lockInfo.fullName}` : 'Move list'}
            {...(isLockedByOther ? {} : attributes)}
            {...(isLockedByOther ? {} : listeners)}
          >
            <GripVertical size={15} />
          </button>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="font-body-md text-xs sm:text-sm font-bold text-on-surface bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-2 py-0.5 outline-none flex-1 min-w-0"
            />
          ) : (
            <h3
              className="font-body-md text-xs sm:text-sm font-bold text-on-surface cursor-pointer flex-1 min-w-0 truncate"
              onClick={() => {
                setEditValue(title);
                setIsEditing(true);
              }}
            >
              {title}
            </h3>
          )}
          <span className="font-mono-label text-[11px] font-bold text-secondary bg-surface-container-lowest border border-outline-variant px-2 py-0.5 rounded-DEFAULT flex-shrink-0">
            {isFiltered && totalTaskCount !== undefined && totalTaskCount !== tasks.length
              ? `${tasks.length}/${totalTaskCount}`
              : tasks.length}
          </span>
        </div>
        <div className="flex gap-1 ml-1">
          <button
            onClick={() => setShowDeleteList(true)}
            className="opacity-0 group-hover/list:opacity-100 p-1 text-secondary hover:text-error hover:bg-error-container rounded-DEFAULT transition-all cursor-pointer"
            title="Delete list"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Task Cards Container */}
      <div
        ref={setCombinedRef}
        className={`flex-1 flex flex-col gap-2.5 px-3 py-1 transition-colors overflow-y-auto overflow-x-hidden min-h-0 thin-scrollbar ${isOver ? 'bg-surface-container-high/40' : ''}`}
      >
        {isFiltered && tasks.length === 0 && (
          <div className="font-body-sm text-[11px] text-secondary text-center py-4 italic">
            No matching tasks
          </div>
        )}
        <SortableContext items={tasks.map((task) => taskSortableId(task.id))} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              sortableId={taskSortableId(task.id)}
              onClick={() => onTaskClick(task)}
              onDelete={onDeleteTask}
              onToggleComplete={onToggleComplete}
              lockInfo={taskLockMap?.[task.id]}
            />
          ))}
        </SortableContext>
      </div>

      {/* Column Footer */}
      <div className="px-3 pb-3 pt-1 shrink-0 bg-surface-container-low">
        {!isAddingTask ? (
          <button
            onClick={() => onAddTask(id)}
            className="w-full py-1.5 font-body-sm text-xs sm:text-sm font-medium text-secondary hover:text-on-surface hover:bg-surface-container-high/40 rounded-DEFAULT transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus size={14} />
            <span>Add Task</span>
          </button>
        ) : (
          <AddTaskForm
            onSubmit={(data) => {
              onSubmitTask(id, data);
              onCancelAddTask();
            }}
            onCancel={onCancelAddTask}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteList}
        onClose={() => setShowDeleteList(false)}
        onConfirm={handleDeleteList}
        title="Delete List"
        message="Are you sure you want to delete this list? All tasks within it will be removed. This action cannot be undone."
        isLoading={isDeletingList}
      />
    </div>
  );
};

export default ListColumn;