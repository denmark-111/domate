import { useState, useRef, useEffect, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';
import AddTaskForm from './AddTaskForm';
import ConfirmModal from '../common/ConfirmModal';
import { GripVertical, Trash2 } from 'lucide-react';

const ListColumn = ({
  id,
  title,
  tasks,
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
  onToggleComplete
}) => {
  const [showDeleteList, setShowDeleteList] = useState(false);
  const [isDeletingList, setIsDeletingList] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: listSortableId,
    data: { type: 'list', listId: id }
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
        transition
      }}
      className={`w-72 sm:w-80 flex-shrink-0 flex flex-col gap-2 max-h-full bg-bg border border-border rounded-lg p-3 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between group/list">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-text-secondary hover:text-text transition-colors flex-shrink-0"
            title="Move list"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={12} />
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
              className="text-xs font-bold text-text-tertiary uppercase tracking-wider bg-transparent border-none outline-none p-0 m-0 flex-1 min-w-0 break-words"
            />
          ) : (
            <h3
              className="text-xs font-bold text-text-tertiary uppercase tracking-wider cursor-pointer flex-1 min-w-0 break-words"
              onClick={() => {
                setEditValue(title);
                setIsEditing(true);
              }}
            >
              {title}
            </h3>
          )}
          <span className="text-[10px] font-medium text-text-secondary bg-bg-tertiary px-1.5 py-0.5 rounded-full flex-shrink-0">{tasks.length}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setShowDeleteList(true)}
            className="opacity-0 group-hover/list:opacity-100 p-0.5 text-red-500 hover:bg-red-50 rounded transition-all"
            title="Delete list"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div
        ref={setCombinedRef}
        className={`flex-1 flex flex-col gap-2 rounded-md transition-colors overflow-y-auto overflow-x-hidden min-h-0 thin-scrollbar ${isOver ? 'bg-bg-tertiary/70' : ''}`}
      >
        <SortableContext items={tasks.map((task) => taskSortableId(task.id))} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              sortableId={taskSortableId(task.id)}
              onClick={() => onTaskClick(task)}
              onDelete={onDeleteTask}
              onToggleComplete={onToggleComplete}
            />
          ))}
        </SortableContext>
        <div className="sticky bottom-0">
          {!isAddingTask ? (
            <button
              onClick={() => onAddTask(id)}
              className="w-full py-1.5 text-xs text-text-secondary hover:text-text bg-bg hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              + Add Task
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