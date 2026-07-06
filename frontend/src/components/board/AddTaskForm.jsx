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
    <form onSubmit={handleSubmit} className="bg-bg border border-border rounded-lg p-2.5 space-y-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-bg outline-none focus:border-input-border-focus text-xs text-text transition-colors"
        autoFocus
      />

      <div className="flex gap-1.5">
        <button
          type="submit"
          className="flex-1 px-3 py-1.5 bg-button hover:bg-button-hover text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-3 py-1.5 bg-button-secondary hover:bg-button-secondary-hover text-button-secondary-text text-xs font-semibold rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddTaskForm;