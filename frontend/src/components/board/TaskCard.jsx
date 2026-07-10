import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ConfirmModal from '../common/ConfirmModal';
import { Trash2, Calendar, MessageSquare, Paperclip, AlignLeft } from 'lucide-react';
import { supabaseStorageService } from '../../services/index.js';

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const TaskCard = ({ task, sortableId, onClick, onDelete, onToggleComplete }) => {
  const isCompleted = !!task.completedAt;
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
      className={`bg-bg p-3 rounded-lg border border-border cursor-pointer group relative ${isDragging ? 'opacity-50 z-50' : ''} ${isCompleted ? 'opacity-60' : ''}`}
      {...attributes}
      {...listeners}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDeleteTask(true);
        }}
        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-0.5 text-text-secondary hover:text-red-500 rounded transition-all"
        title="Delete task"
      >
        <Trash2 size={12} />
      </button>
      <div className="flex items-start gap-1.5">
        <label
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => {
              e.stopPropagation();
              onToggleComplete?.(task.id, isCompleted ? null : new Date().toISOString());
            }}
            className="w-3.5 h-3.5 rounded border-text-secondary accent-button cursor-pointer"
          />
        </label>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium transition-colors ${isCompleted ? 'text-text-secondary line-through' : 'text-text group-hover:text-text-accent'}`}>
            {task.name || task.title}
          </p>
          <div className="flex gap-1.5 flex-wrap mt-1 min-h-[16px]">
            {task.labels?.map((label) => (
              <span
                key={label.id}
                className="px-1.5 py-0.5 text-[9px] font-bold rounded text-white"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 text-text-secondary">
              {task.dueDate && (
                <span className={`flex items-center gap-0.5 text-[10px] ${new Date(task.dueDate) < new Date() ? 'text-red-500' : ''}`}>
                  <Calendar size={10} />
                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              {task.description && (
                <span className="flex items-center gap-0.5 text-[10px]">
                  <AlignLeft size={10} />
                </span>
              )}
              {commentCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px]">
                  <MessageSquare size={10} />
                  {commentCount}
                </span>
              )}
              {task.attachments?.length > 0 && (
                <span className="flex items-center gap-0.5 text-[10px]">
                  <Paperclip size={10} />
                  {task.attachments.length}
                </span>
              )}
            </div>
            <div className="flex items-center min-h-[20px]">
              {task.assignments?.slice(0, 3).map((a, i) => {
                const avatarUrl = a.user?.avatarUrl ? supabaseStorageService.getAvatarUrl(a.user.avatarUrl) : null;
                return (
                  <div
                    key={a.userId}
                    className="w-5 h-5 rounded-full bg-button border-2 border-bg flex items-center justify-center text-[7px] text-white font-bold -ml-[5px] first:ml-0 overflow-hidden"
                    style={{ zIndex: 3 - i }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(a.user?.fullName || a.user?.email)
                    )}
                  </div>
                );
              })}
              {task.assignments && task.assignments.length > 3 && (
                <div className="w-5 h-5 rounded-full bg-bg-tertiary border-2 border-bg flex items-center justify-center text-[7px] text-text-secondary font-bold -ml-[5px]">
                  +{task.assignments.length - 3}
                </div>
              )}
            </div>
          </div>
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