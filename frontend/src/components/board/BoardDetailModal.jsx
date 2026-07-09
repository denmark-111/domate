import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ColorPicker from '../common/ColorPicker';
import { BOARD_COLORS } from '../../data/colorPalette';

const BoardDetailModal = ({ isOpen, onClose, board, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', color: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && board) {
      setFormData({
        name: board.name || '',
        description: board.description || '',
        color: board.color || '',
      });
      setEditing(false);
      setError('');
    }
  }, [isOpen, board]);

  if (!isOpen || !board) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Board name is required');
      return;
    }
    setIsSaving(true);
    try {
      const payload = { name: formData.name, description: formData.description };
      if (formData.color) payload.color = formData.color;
      const res = await onUpdate(board.id, payload);
      if (res?.success) {
        onClose();
      } else {
        setError(res?.error || 'Failed to update board');
      }
    } catch {
      setError('Failed to update board');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => {
    setFormData({
      name: board.name || '',
      description: board.description || '',
      color: board.color || '',
    });
    setError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-bg rounded-xl border border-border shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text">Board Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-text rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {!editing ? (
          <>
            {/* View mode */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3">
                {board.color && (
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: board.color }}
                  />
                )}
                <h3 className="text-xl font-bold text-text">{board.name}</h3>
              </div>

              <div>
                {board.description ? (
                  <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{board.description}</p>
                ) : (
                  <p className="text-sm text-text-tertiary italic">No description provided</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={startEditing}
                className="px-5 py-2 rounded-lg font-semibold text-sm bg-button hover:bg-button-hover text-white transition-colors"
              >
                Edit Details
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Edit mode */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-bg text-text outline-none focus:border-input-border-focus transition-colors"
                  placeholder="Board name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Color</label>
                <ColorPicker
                  colors={BOARD_COLORS}
                  selectedColor={formData.color || BOARD_COLORS[0]}
                  onChange={(color) => setFormData((prev) => ({ ...prev, color }))}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows="4"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-input-bg text-text outline-none focus:border-input-border-focus transition-colors resize-none"
                  placeholder="Board description"
                />
              </div>

              {error && (
                <div className="p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error-text">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isSaving}
                className="px-5 py-2 rounded-lg font-semibold text-sm text-text-secondary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-lg font-semibold text-sm bg-button hover:bg-button-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BoardDetailModal;
