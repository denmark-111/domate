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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-bg rounded-xl shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-text">Create Board</h2>
          <p className="text-sm text-text-secondary mt-1">Add a new board to {workspaceName}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-text-secondary mb-1.5">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Development, Marketing, Q2 Planning"
              className={`w-full px-4 py-2.5 rounded-lg border outline-none focus:border-input-border-focus transition-colors ${
                errors.name ? 'border-error-border bg-error-bg' : 'border-border bg-bg'
              }`}
            />
            {errors.name && (
              <p className="text-error-text text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">
              Color
            </label>
            <ColorPicker
              colors={BOARD_COLORS}
              selectedColor={formData.color}
              onChange={(color) => setFormData(prev => ({ ...prev, color }))}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-text-secondary mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="What is this board for?"
              rows="3"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg outline-none focus:border-input-border-focus transition-colors resize-none"
            />
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 rounded-lg bg-error-bg border border-error-border">
              <p className="text-error-text text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border bg-bg hover:bg-bg-secondary transition-colors font-semibold text-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-button hover:bg-button-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-white flex items-center justify-center gap-2"
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
