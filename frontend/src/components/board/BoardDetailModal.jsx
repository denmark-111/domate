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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div
        className="relative bg-surface-container-lowest rounded-DEFAULT border border-outline-variant/60 shadow-xl w-full max-w-md mx-auto flex flex-col max-h-[85vh] overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-outline-variant/60 shrink-0 sticky top-0 bg-surface-container-lowest z-10">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-on-surface">Board Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-on-surface rounded-DEFAULT hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {!editing ? (
          <>
            {/* View mode */}
            <div className="px-4 sm:px-6 py-5 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center gap-3">
                {board.color && (
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: board.color }}
                  />
                )}
                <h3 className="font-headline-md text-lg sm:text-xl font-bold text-on-surface break-words">{board.name}</h3>
              </div>

              <div>
                {board.description ? (
                  <p className="font-body-sm text-sm text-secondary whitespace-pre-wrap leading-relaxed break-words">{board.description}</p>
                ) : (
                  <p className="font-body-sm text-sm text-outline italic">No description provided</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 px-4 sm:px-6 py-3.5 border-t border-outline-variant/60 shrink-0 bg-surface-container-lowest">
              <button
                onClick={startEditing}
                className="px-4 py-2.5 font-body-sm text-sm font-semibold bg-primary text-on-primary rounded-DEFAULT hover:opacity-90 transition-all cursor-pointer shadow-2xs"
              >
                Edit Details
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Edit mode */}
            <div className="px-4 sm:px-6 py-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block font-body-sm text-xs font-semibold text-secondary mb-1.5">Board Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-DEFAULT border border-outline-variant/60 bg-surface-container-lowest font-body-sm text-sm text-on-surface outline-none focus:border-primary transition-colors shadow-2xs"
                  placeholder="Board name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-body-sm text-xs font-semibold text-secondary mb-1.5">Board Color</label>
                <ColorPicker
                  colors={BOARD_COLORS}
                  selectedColor={formData.color || BOARD_COLORS[0]}
                  onChange={(color) => setFormData((prev) => ({ ...prev, color }))}
                />
              </div>

              <div>
                <label className="block font-body-sm text-xs font-semibold text-secondary mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows="4"
                  className="w-full p-3.5 rounded-DEFAULT border border-outline-variant/60 bg-surface-container-lowest font-body-sm text-sm text-on-surface outline-none focus:border-primary transition-colors resize-none shadow-2xs"
                  placeholder="Board description"
                />
              </div>

              {error && (
                <div className="p-3 bg-error-container border border-error rounded-DEFAULT font-body-sm text-xs text-on-error-container">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 px-4 sm:px-6 py-3.5 border-t border-outline-variant/60 shrink-0 bg-surface-container-lowest">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isSaving}
                className="px-4 py-2.5 font-body-sm text-sm font-semibold rounded-DEFAULT border border-outline-variant/60 bg-surface-container-lowest text-on-surface hover:border-primary/60 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2.5 font-body-sm text-sm font-semibold bg-primary text-on-primary rounded-DEFAULT hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
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