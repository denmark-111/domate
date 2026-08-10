import { useState, useEffect } from 'react';
import { X, Plus, Pencil } from 'lucide-react';
import { labelService } from '../../services/index.js';

const LABEL_COLORS = [
  '#61BD4F', '#F2D600', '#FF9F1A', '#EB5A46',
  '#C377E0', '#0079BF', '#00C2E0', '#51E898',
  '#FF78CB', '#B3BAC5',
];

const BoardLabelsModal = ({ isOpen, onClose, boardId, boardLabels, onLabelCreated, onLabelUpdated, onLabelDeleted }) => {
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [editLabelName, setEditLabelName] = useState('');
  const [editLabelColor, setEditLabelColor] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [showNewLabelForm, setShowNewLabelForm] = useState(false);
  const [isSavingLabel, setIsSavingLabel] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditingLabelId(null);
      setEditLabelName('');
      setEditLabelColor('');
      setNewLabelName('');
      setNewLabelColor(LABEL_COLORS[0]);
      setShowNewLabelForm(false);
      setIsSavingLabel(false);
    }
  }, [isOpen]);

  const usedColors = new Set((boardLabels || []).map(l => l.color));
  const availableLabelColors = LABEL_COLORS.filter(c => !usedColors.has(c)).length > 0
    ? LABEL_COLORS.filter(c => !usedColors.has(c))
    : LABEL_COLORS;

  if (!isOpen) return null;

  const handleCreateLabel = async (e) => {
    e.preventDefault();
    if (!newLabelName.trim() || !boardId) return;
    setIsSavingLabel(true);
    const res = await labelService.createBoardLabel(boardId, {
      name: newLabelName.trim(),
      color: newLabelColor,
    });
    if (res.success) {
      onLabelCreated?.(res.data);
      setNewLabelName('');
      setNewLabelColor(LABEL_COLORS[0]);
      setShowNewLabelForm(false);
    }
    setIsSavingLabel(false);
  };

  const handleStartEditLabel = (label) => {
    setEditingLabelId(label.id);
    setEditLabelName(label.name);
    setEditLabelColor(label.color);
    setShowNewLabelForm(false);
  };

  const handleSaveEditLabel = async (labelId) => {
    if (!editLabelName.trim() || !boardId) return;
    setIsSavingLabel(true);
    const res = await labelService.updateBoardLabel(boardId, labelId, {
      name: editLabelName.trim(),
      color: editLabelColor,
    });
    if (res.success) {
      onLabelUpdated?.(res.data);
      setEditingLabelId(null);
    }
    setIsSavingLabel(false);
  };

  const handleDeleteLabel = async (labelId) => {
    if (!boardId) return;
    const res = await labelService.deleteBoardLabel(boardId, labelId);
    if (res.success) {
      onLabelDeleted?.(labelId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-DEFAULT border border-outline-variant/60 shadow-xl w-full max-w-md mx-auto flex flex-col max-h-[85vh] overflow-hidden z-10" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-outline-variant/60 shrink-0 sticky top-0 bg-surface-container-lowest z-10">
          <h2 className="font-headline-md text-base sm:text-lg font-bold text-on-surface">Board Labels</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-on-surface rounded-DEFAULT hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
          {showNewLabelForm && (
            <form onSubmit={handleCreateLabel} className="space-y-3">
              <div>
                <label className="block font-body-sm text-xs font-semibold text-secondary mb-1.5">Label Name</label>
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="New label name..."
                  className="w-full px-3.5 py-2.5 font-body-sm text-sm rounded-DEFAULT border border-outline-variant/60 bg-surface-container-lowest text-on-surface outline-none focus:border-primary transition-colors shadow-2xs"
                  autoFocus
                />
              </div>
              <div>
                <label className="block font-body-sm text-xs font-semibold text-secondary mb-1.5">Color</label>
                <div className="flex gap-1.5 flex-wrap">
                  {availableLabelColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewLabelColor(color)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-DEFAULT border-2 transition-all cursor-pointer ${
                        newLabelColor === color ? 'border-white scale-110 ring-2 ring-primary' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={isSavingLabel || !newLabelName.trim()}
                className="w-full px-4 py-2.5 bg-primary text-on-primary font-body-sm text-sm font-semibold rounded-DEFAULT hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {isSavingLabel ? 'Adding...' : 'Create Label'}
              </button>
            </form>
          )}

          {boardLabels.length === 0 && !showNewLabelForm && (
            <p className="font-body-sm text-sm text-secondary text-center py-8">No labels yet. Add one to get started.</p>
          )}

          <div className="space-y-2">
            {boardLabels.map((label) => (
              <div
                key={label.id}
                className="flex items-center gap-3 p-2.5 rounded-DEFAULT border border-outline-variant/60 bg-surface-container-low"
              >
                {editingLabelId === label.id ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSaveEditLabel(label.id); }}
                    className="w-full space-y-3"
                  >
                    <div>
                      <label className="block font-body-sm text-xs font-semibold text-secondary mb-1.5">Label Name</label>
                      <input
                        type="text"
                        value={editLabelName}
                        onChange={(e) => setEditLabelName(e.target.value)}
                        placeholder="Label name"
                        className="w-full px-3.5 py-2.5 rounded-DEFAULT border border-outline-variant/60 bg-surface-container-lowest font-body-sm text-sm text-on-surface outline-none focus:border-primary transition-colors shadow-2xs"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block font-body-sm text-xs font-semibold text-secondary mb-1.5">Color</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {availableLabelColors.concat(
                          usedColors.has(editLabelColor) ? [editLabelColor] : []
                        ).map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditLabelColor(color)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-DEFAULT border-2 transition-all cursor-pointer ${
                              editLabelColor === color ? 'border-white scale-110 ring-2 ring-primary' : 'border-transparent hover:scale-110'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingLabelId(null)}
                        className="px-4 py-2.5 font-body-sm text-sm font-semibold rounded-DEFAULT border border-outline-variant/60 bg-surface-container-lowest text-on-surface hover:border-primary/60 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingLabel || !editLabelName.trim()}
                        className="px-4 py-2.5 font-body-sm text-sm font-semibold rounded-DEFAULT bg-primary text-on-primary hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-2xs"
                      >
                        {isSavingLabel ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <span
                      className="w-4 h-4 rounded-DEFAULT shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="flex-1 font-body-sm text-sm text-on-surface truncate">{label.name}</span>
                    <button
                      onClick={() => handleStartEditLabel(label)}
                      className="p-1.5 text-secondary hover:text-on-surface rounded-DEFAULT hover:bg-surface-container-high transition-colors shrink-0 cursor-pointer"
                      title="Edit label"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteLabel(label.id)}
                      className="p-1.5 text-secondary hover:text-error rounded-DEFAULT hover:bg-error-container transition-colors shrink-0 cursor-pointer"
                      title="Delete label"
                    >
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {!showNewLabelForm && (
            <button
              onClick={() => {
                setEditingLabelId(null);
                setShowNewLabelForm(true);
              }}
              className="w-full px-4 py-2.5 font-body-sm text-sm font-semibold bg-primary text-on-primary rounded-DEFAULT hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
            >
              <Plus size={16} />
              <span>Add Label</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardLabelsModal;