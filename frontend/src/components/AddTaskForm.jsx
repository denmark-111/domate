import React, { useState } from 'react';

const AddTaskForm = ({ columnTitle, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit({ title: title.trim() });
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--color-bg-blue-50)] p-3 rounded-lg border-2 border-[var(--color-border-blue-300)] space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        className="w-full px-3 py-2 rounded border border-[var(--color-border-blue-200)] bg-[var(--color-bg-primary)] outline-none focus:border-[var(--color-border-blue-500)] text-sm text-[var(--color-text-primary)]"
        autoFocus
      />
      
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-[var(--color-bg-blue-button)] hover:bg-[var(--color-bg-blue-button-hover)] text-white text-sm font-medium rounded transition-colors"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-[var(--color-bg-gray-button)] hover:bg-[var(--color-bg-gray-button-hover)] text-[var(--color-text-gray-700)] text-sm font-medium rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddTaskForm;
