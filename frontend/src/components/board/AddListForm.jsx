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
    <div className="w-72 sm:w-80 flex-shrink-0">
      <div className="bg-surface-container-low border border-outline-variant rounded-DEFAULT p-3 space-y-3">
        <h3 className="font-mono-label text-xs font-bold text-on-surface uppercase tracking-wider">New List</h3>

        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="List title..."
            className="w-full px-3 py-1.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-body-sm text-xs text-on-surface transition-colors"
            autoFocus
          />

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-1.5 bg-primary text-on-primary font-label-caps text-xs font-bold uppercase tracking-wider rounded-DEFAULT hover:opacity-90 transition-opacity cursor-pointer"
            >
              Create
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
      </div>
    </div>
  );
};

export default AddListForm;