import React, { useState } from 'react';

const AddListForm = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit({ title: title.trim() });
      setTitle('');
    }
  };

  return (
    <div className="w-80 flex-shrink-0 flex flex-col gap-4">
      <div className="px-2">
        <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">New List</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-input-bg p-3 rounded-lg border-2 border-input-border space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="List title..."
          className="w-full px-3 py-2 rounded border border-input-border-light bg-bg outline-none focus:border-input-border-focus text-sm font-medium text-text"
          autoFocus
        />
        
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-button hover:bg-button-hover text-white text-sm font-medium rounded transition-colors"
          >
            Create
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
    </div>
  );
};

export default AddListForm;
