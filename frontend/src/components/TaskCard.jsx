import React, { useState } from 'react';
import ConfirmModal from './ConfirmModal';
import { Trash2 } from 'lucide-react';

const TaskCard = ({ task, onClick, onDelete }) => {
  const commentCount = Array.isArray(task.comments) ? task.comments.length : 0;
  const [showDeleteTask, setShowDeleteTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  const handleDeleteTask = async () => {
    setIsDeletingTask(true);
    await onDelete?.(task.id);
    setIsDeletingTask(false);
    setShowDeleteTask(false);
  };

  return (
    <div
      onClick={onClick}
      className="bg-bg-secondary p-4 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative"
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
          <span className="text-xs">💬 {commentCount}</span>
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
