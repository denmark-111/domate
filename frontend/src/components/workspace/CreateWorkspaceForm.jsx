import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import { supabaseStorageService } from '../../services/supabaseStorageService';
import ColorPicker from '../common/ColorPicker';
import { WORKSPACE_COLORS, autoAssignColor } from '../../data/colorPalette';
import { Image, Loader, X } from 'lucide-react';

const CreateWorkspaceForm = ({ onClose }) => {
  const navigate = useNavigate();
  const { createWorkspace, updateWorkspace } = useWorkspace();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: autoAssignColor(0, WORKSPACE_COLORS)
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
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

  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createWorkspace({
        name: formData.name,
        description: formData.description,
        color: formData.color
      });

      if (result.success) {
        // If a cover file was selected, upload it with the real workspace ID
        if (coverFile) {
          const coverImageUrl = await supabaseStorageService.uploadWorkspaceCoverUrl(result.data.id, coverFile);
          await updateWorkspace(result.data.id, { coverImageUrl });
        }

        navigate(`/workspaces/${result.data.id}`);
        onClose?.();
      } else {
        throw new Error(result.error || 'Failed to create workspace');
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      setErrors({ submit: error.message || 'Failed to create workspace. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:max-w-md sm:max-h-[90vh] flex flex-col bg-bg sm:rounded-xl sm:shadow-xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <h2 className="text-xl font-bold text-text">Create Workspace</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-text rounded-lg hover:bg-bg-tertiary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
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
              placeholder="Enter workspace title"
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
              colors={WORKSPACE_COLORS}
              selectedColor={formData.color}
              onChange={(color) => setFormData(prev => ({ ...prev, color }))}
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">
              Cover Image
            </label>
            <input
              type="file"
              id="coverImageUrl"
              accept="image/*"
              onChange={handleCoverSelect}
              className="hidden"
            />
            {coverPreview ? (
              <div className="relative w-full h-28 rounded-lg overflow-hidden border border-border mb-2">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full text-white text-xs flex items-center justify-center transition-colors"
                  title="Remove cover"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label
                htmlFor="coverImageUrl"
                className="flex flex-col items-center justify-center w-full h-28 rounded-lg border-2 border-dashed border-border bg-bg hover:bg-bg-secondary cursor-pointer transition-colors"
              >
                <Image size={24} className="text-text-secondary mb-1" />
                <span className="text-sm text-text-secondary">Click to upload cover image</span>
              </label>
            )}
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
              placeholder="Add a description..."
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
        </form>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-bg hover:bg-bg-secondary transition-colors font-semibold text-text"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 rounded-lg bg-button hover:bg-button-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-white flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              'Create'
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateWorkspaceForm;
