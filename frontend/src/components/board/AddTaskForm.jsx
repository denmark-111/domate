import { useState } from 'react';

const AddTaskForm = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit({ title: title.trim() });
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-2.5 space-y-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        className="w-full px-3 py-1.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-body-sm text-xs text-on-surface transition-colors"
        autoFocus
      />

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 px-3 py-1.5 bg-primary text-on-primary font-label-caps text-xs font-bold uppercase tracking-wider rounded-DEFAULT hover:opacity-90 transition-opacity cursor-pointer"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-3 py-1.5 bg-surface-container-lowest text-on-surface border border-outline-variant font-label-caps text-xs font-bold uppercase tracking-wider rounded-DEFAULT hover:border-primary transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddTaskForm;