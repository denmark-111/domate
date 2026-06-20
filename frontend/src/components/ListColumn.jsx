import React, { useState } from 'react';
import TaskCard from './TaskCard';
import AddTaskForm from './AddTaskForm';
import ConfirmModal from './ConfirmModal';
import { Edit3, Trash2 } from 'lucide-react';

const ListColumn = ({ id, title, tasks, onAddTask, isAddingTask, onCancelAddTask, onTaskClick, onSubmitTask, onDeleteList, onDeleteTask, onEditList }) => {
  const [showDeleteList, setShowDeleteList] = useState(false);
  const [isDeletingList, setIsDeletingList] = useState(false);

  const handleDeleteList = async () => {
    setIsDeletingList(true);
    await onDeleteList(id);
    setIsDeletingList(false);
    setShowDeleteList(false);
  };

  return (
    <div className="w-80 flex-shrink-0 flex flex-col gap-4">
      <div className="flex items-center justify-between px-2 group/list">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">{title}</h3>
          <span className="text-xs font-medium text-text-secondary bg-bg-tertiary px-2 py-1 rounded-full">{tasks.length}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEditList({ id, title })}
            className="opacity-0 group-hover/list:opacity-100 p-1 text-blue-500 hover:bg-blue-50 rounded transition-all"
            title="Edit list"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => setShowDeleteList(true)}
            className="opacity-0 group-hover/list:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
            title="Delete list"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
            onDelete={onDeleteTask}
          />
        ))}
        {!isAddingTask ? (
          <button
            onClick={() => onAddTask(id)}
            className="w-full py-2 text-sm text-text-secondary hover:bg-bg-tertiary rounded-md border-2 border-dashed border-border transition-colors"
          >
            + Add Task
          </button>
        ) : (
          <AddTaskForm
            columnTitle={title}
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
