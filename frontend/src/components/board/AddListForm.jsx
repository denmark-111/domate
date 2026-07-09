import { useState } from 'react';

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
    <div className="w-80 flex-shrink-0">
      <div className="bg-bg border border-border rounded-lg p-3 space-y-3">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">New List</h3>

        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="List title..."
            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-bg outline-none focus:border-input-border-focus text-xs font-medium text-text transition-colors"
            autoFocus
          />

          <div className="flex gap-1.5">
            <button
              type="submit"
              className="flex-1 px-3 py-1.5 bg-button hover:bg-button-hover text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Create
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
      </div>
    </div>
  );
};

export default AddListForm;