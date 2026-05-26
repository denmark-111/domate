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
    <form onSubmit={handleSubmit} className="bg-input-bg p-3 rounded-lg border-2 border-input-border space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        className="w-full px-3 py-2 rounded border border-input-border-light bg-bg outline-none focus:border-input-border-focus text-sm text-text"
        autoFocus
      />
      
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-button hover:bg-button-hover text-white text-sm font-medium rounded transition-colors"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-button-secondary hover:bg-button-secondary-hover text-button-secondary-text text-sm font-medium rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddTaskForm;
