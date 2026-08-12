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

const TaskCard = ({ task, sortableId, onClick, onDelete, onToggleComplete, lockInfo }) => {
  const isCompleted = !!task.completedAt;
  const commentCount = task._count?.comments ?? 0;
  const [showDeleteTask, setShowDeleteTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const isLockedByOther = !!lockInfo;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: sortableId,
    data: { type: 'task', taskId: task.id, listId: task.listId },
    disabled: isLockedByOther
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

  const hasMetadata = task.dueDate || task.description || commentCount > 0 || task.attachments?.length > 0 || task.assignments?.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        borderColor: lockInfo ? lockInfo.color : undefined
      }}
      onClick={onClick}
      className={`bg-surface-container-lowest p-3.5 rounded-DEFAULT border border-outline-variant hover:border-primary transition-all duration-200 cursor-pointer group relative shadow-2xs space-y-2.5 touch-manipulation ${
        lockInfo ? 'border-2 shadow-md z-10' : ''
      } ${isDragging ? 'opacity-50 z-50' : ''} ${isCompleted ? 'opacity-60' : ''} ${
        isLockedByOther ? 'select-none opacity-80' : ''
      }`}
      {...(isLockedByOther ? {} : attributes)}
      {...(isLockedByOther ? {} : listeners)}
    >
      {lockInfo && (
        <div
          className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded-DEFAULT text-white font-mono-label text-[9px] font-bold shadow-sm z-20 truncate max-w-[120px] pointer-events-none"
          style={{ backgroundColor: lockInfo.color }}
        >
          Moving: {lockInfo.fullName}
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDeleteTask(true);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-secondary hover:text-error hover:bg-error-container rounded-DEFAULT transition-all cursor-pointer"
        title="Delete task"
      >
        <Trash2 size={13} />
      </button>

      {/* Top Title Row with Checkbox */}
      <div className="flex items-start gap-2.5">
        <label
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 mt-0.5"
        >
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => {
              e.stopPropagation();
              onToggleComplete?.(task.id, isCompleted ? null : new Date().toISOString());
            }}
            className="w-3.5 h-3.5 rounded-DEFAULT border-outline-variant accent-primary cursor-pointer"
          />
        </label>
        <p className={`font-body-md text-xs sm:text-sm font-medium leading-snug transition-colors flex-1 min-w-0 ${isCompleted ? 'text-secondary line-through' : 'text-on-surface group-hover:text-primary'}`}>
          {task.name || task.title}
        </p>
      </div>

      {/* Category Labels Pill Row */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex gap-1.5 flex-wrap pl-6">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="px-2 py-0.5 font-mono-label text-[10px] font-semibold uppercase rounded-DEFAULT text-white inline-block shadow-2xs"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Metadata & Avatar Stack Row */}
      {hasMetadata && (
        <div className="flex items-center justify-between pt-1 pl-6">
          <div className="flex items-center gap-2.5 font-mono-label text-[10px] text-secondary">
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() ? 'text-error font-bold' : ''}`}>
                <Calendar size={12} className="text-secondary shrink-0" />
                <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </span>
            )}
            {task.description && (
              <span className="flex items-center gap-0.5" title="Has description">
                <AlignLeft size={12} className="text-secondary shrink-0" />
              </span>
            )}
            {commentCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare size={12} className="text-secondary shrink-0" />
                <span>{commentCount}</span>
              </span>
            )}
            {task.attachments?.length > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip size={12} className="text-secondary shrink-0" />
                <span>{task.attachments.length}</span>
              </span>
            )}
          </div>

          <div className="flex items-center -space-x-1.5 shrink-0 ml-auto">
            {task.assignments?.slice(0, 3).map((a, i) => {
              const avatarUrl = a.user?.avatarUrl ? supabaseStorageService.getAvatarUrl(a.user.avatarUrl) : null;
              return (
                <div
                  key={a.userId}
                  className="w-5 h-5 rounded-full bg-primary text-on-primary border-2 border-surface-container-lowest flex items-center justify-center text-[7px] font-bold overflow-hidden shrink-0 shadow-2xs"
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
              <div className="w-5 h-5 rounded-full bg-surface-container-high border-2 border-surface-container-lowest flex items-center justify-center text-[7px] font-bold text-secondary shrink-0 shadow-2xs">
                +{task.assignments.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

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