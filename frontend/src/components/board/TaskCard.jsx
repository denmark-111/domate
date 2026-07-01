import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ConfirmModal from '../common/ConfirmModal';
import { Trash2, Calendar, MessageSquare } from 'lucide-react';

const TaskCard = ({ task, sortableId, onClick, onDelete }) => {
  const commentCount = task._count?.comments ?? 0;
  const [showDeleteTask, setShowDeleteTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: sortableId,
    data: { type: 'task', taskId: task.id, listId: task.listId }
  });

  const handleDeleteTask = async () => {
    setIsDeletingTask(true);
    try {
      await onDelete?.(task.id);
    } finally {
      setIsDeletingTask(false);
      setShowDeleteTask(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
      onClick={onClick}
      className={`bg-bg-secondary p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative ${isDragging ? 'opacity-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDeleteTask(true);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
        title="Delete task"
      >
        <Trash2 size={14} />
      </button>
      <div className="flex gap-2 mb-3 flex-wrap">
        {task.labels?.map((label) => (
          <span
            key={label.id}
            className="px-2 py-0.5 text-[10px] font-bold rounded uppercase text-white"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
          </span>
        ))}
      </div>
      <p className="text-sm text-text font-medium mb-4 group-hover:text-text-accent transition-colors">
        {task.name || task.title}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-secondary">
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-xs ${new Date(task.dueDate) < new Date() ? 'text-red-500' : ''}`}>
              <Calendar size={12} />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {commentCount > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <MessageSquare size={12} />
              {commentCount}
            </span>
          )}
        </div>
        <div className="w-6 h-6 rounded-full bg-button border-2 border-bg flex items-center justify-center text-[8px] text-white font-bold">
          {task.assigneeInitials || '?'}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteTask}
        onClose={() => setShowDeleteTask(false)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        isLoading={isDeletingTask}
      />
    </div>
  );
};

export default TaskCard;
