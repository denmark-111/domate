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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-bg rounded-xl border border-border shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-text">Board Labels</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-text rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-4">
          {showNewLabelForm && (
            <form onSubmit={handleCreateLabel} className="space-y-2">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="New label name..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors"
                autoFocus
              />
              <div className="flex gap-1.5 flex-wrap">
                {availableLabelColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewLabelColor(color)}
                    className={`w-8 h-8 rounded-md border-2 transition-all ${
                      newLabelColor === color ? 'border-white scale-110 ring-2 ring-accent' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={isSavingLabel || !newLabelName.trim()}
                className="w-full px-3 py-2 bg-button hover:bg-button-hover text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {isSavingLabel ? 'Adding...' : 'Create'}
              </button>
            </form>
          )}

          {boardLabels.length === 0 && !showNewLabelForm && (
            <p className="text-sm text-text-secondary text-center py-8">No labels yet. Add one to get started.</p>
          )}

          <div className="space-y-2">
            {boardLabels.map((label) => (
              <div
                key={label.id}
                className="flex items-center gap-3 p-2 rounded-xl border border-border bg-bg-secondary"
              >
                {editingLabelId === label.id ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSaveEditLabel(label.id); }}
                    className="w-full space-y-3"
                  >
                    <input
                      type="text"
                      value={editLabelName}
                      onChange={(e) => setEditLabelName(e.target.value)}
                      placeholder="Label name"
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors"
                      autoFocus
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {availableLabelColors.concat(
                        usedColors.has(editLabelColor) ? [editLabelColor] : []
                      ).map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditLabelColor(color)}
                          className={`w-8 h-8 rounded-md border-2 transition-all ${
                            editLabelColor === color ? 'border-white scale-110 ring-2 ring-accent' : 'border-transparent hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSavingLabel || !editLabelName.trim()}
                        className="px-3 py-2 text-sm font-semibold rounded-lg bg-button hover:bg-button-hover text-white transition-colors disabled:opacity-50"
                      >
                        {isSavingLabel ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingLabelId(null)}
                        className="px-3 py-2 text-sm font-semibold rounded-lg text-text-secondary hover:bg-bg-tertiary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <span
                      className="w-4 h-4 rounded shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="flex-1 text-sm text-text">{label.name}</span>
                    <button
                      onClick={() => handleStartEditLabel(label)}
                      className="p-1.5 text-text-secondary hover:text-text rounded-lg hover:bg-bg-tertiary transition-colors"
                      title="Edit label"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteLabel(label.id)}
                      className="p-1.5 text-text-secondary hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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
              className="w-full px-3 py-2 text-sm font-semibold rounded-lg bg-button hover:bg-button-hover text-white transition-colors"
            >
              + Add label
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardLabelsModal;
