import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateWorkspaceForm = ({ onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
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
      newErrors.name = 'Workspace name is required';
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
      await new Promise(resolve => setTimeout(resolve, 800));

      const newWorkspace = {
        id: `w${Date.now()}`,
        name: formData.name,
        description: formData.description
      };

      console.log('Creating workspace:', newWorkspace);
      navigate(`/workspaces/${newWorkspace.id}`);
      onClose?.();
    } catch (error) {
      console.error('Error creating workspace:', error);
      setErrors({ submit: 'Failed to create workspace. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--color-bg-primary)] rounded-2xl shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-primary)]">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Create Workspace</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter workspace title"
              className={`w-full px-4 py-2 rounded-lg border-2 outline-none focus:border-[var(--color-border-blue-500)] transition-colors ${
                errors.name ? 'border-[var(--color-border-red-500)] bg-[var(--color-bg-red-50)]' : 'border-[var(--color-border-primary)] bg-[var(--color-bg-primary)]'
              }`}
            />
            {errors.name && (
              <p className="text-[var(--color-text-red-600)] text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Add a description..."
              rows="3"
              className="w-full px-4 py-2 rounded-lg border-2 border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] outline-none focus:border-[var(--color-border-blue-500)] transition-colors resize-none"
            />
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 rounded-lg bg-[var(--color-bg-red-50)] border border-[var(--color-border-red-200)]">
              <p className="text-[var(--color-text-red-700)] text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border-2 border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors font-medium text-[var(--color-text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-bg-blue-button)] hover:bg-[var(--color-bg-blue-button-hover)] disabled:bg-gray-400 transition-colors font-medium text-white disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkspaceForm;
