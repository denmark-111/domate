import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import ColorPicker from '../common/ColorPicker';
import { BOARD_COLORS, autoAssignColor } from '../../data/colorPalette';

const CreateBoardForm = ({ workspaceName, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: autoAssignColor(0, BOARD_COLORS)
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Board name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onSubmit?.({
        name: formData.name,
        description: formData.description,
        color: formData.color
      });
      
      if (success !== false) {
        onClose?.();
      }
    } catch (error) {
      console.error('Error creating board:', error);
      setErrors({ submit: 'Failed to create board. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-DEFAULT border border-outline-variant shadow-xl w-full max-w-md mx-auto flex flex-col max-h-[85vh] overflow-hidden z-10" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-outline-variant shrink-0 bg-surface-container-lowest">
          <h2 className="font-headline-md text-xl font-bold text-on-surface">Create Board</h2>
          <p className="font-body-sm text-sm text-secondary mt-1">Add a new board to {workspaceName}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block font-mono-label text-xs uppercase font-bold text-on-surface mb-1.5">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Development, Marketing, Q2 Planning"
              className={`w-full px-3 py-2 rounded-DEFAULT border font-body-sm text-sm outline-none transition-colors ${
                errors.name
                  ? 'border-error text-error bg-error-container/20'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary'
              }`}
            />
            {errors.name && (
              <p className="text-error font-body-sm text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="block font-mono-label text-xs uppercase font-bold text-on-surface mb-1.5">
              Color
            </label>
            <ColorPicker
              colors={BOARD_COLORS}
              selectedColor={formData.color}
              onChange={(color) => setFormData(prev => ({ ...prev, color }))}
            />
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 rounded-DEFAULT bg-error-container border border-error">
              <p className="text-on-error-container font-body-sm text-xs">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest hover:border-primary transition-colors font-label-caps text-xs font-bold uppercase text-on-surface cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-DEFAULT bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-label-caps text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Board'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardForm;
