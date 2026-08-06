import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import { supabaseStorageService } from '../../services/supabaseStorageService';
import ColorPicker from '../common/ColorPicker';
import { WORKSPACE_COLORS, autoAssignColor } from '../../data/colorPalette';
import Input from '../common/Input';
import Button from '../common/Button';
import { Loader, X, UploadCloud } from 'lucide-react';

const CreateWorkspaceForm = ({ onClose }) => {
  const navigate = useNavigate();
  const { createWorkspace, updateWorkspace } = useWorkspace();
  const [coverType, setCoverType] = useState('color'); // 'color' | 'image'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-[2px] p-4">
      {/* Backdrop click handler */}
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative bg-surface-container-lowest border border-outline-variant w-full max-w-[560px] rounded-DEFAULT shadow-xs flex flex-col z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest shrink-0">
          <h2 className="font-headline-md text-xl font-semibold text-on-surface m-0 tracking-tight">
            Create New Workspace
          </h2>
          <button
            onClick={onClose}
            className="text-secondary hover:text-on-surface transition-colors p-1.5 rounded-DEFAULT hover:bg-surface-container-low"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[75vh]">
          {/* Workspace Name */}
          <Input
            label="Workspace Name *"
            id="workspaceName"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g. Design Systems Team"
            autoComplete="off"
            error={errors.name}
          />

          {/* Cover Picker (Color vs Image tabs) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline mb-1">
              <label className="font-mono-label text-xs uppercase font-bold tracking-wider text-on-surface">
                Cover
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCoverType('color')}
                  className={`font-mono-label text-xs pb-1 transition-colors cursor-pointer ${
                    coverType === 'color'
                      ? 'text-on-surface border-b-2 border-primary font-bold'
                      : 'text-secondary hover:text-on-surface border-b-2 border-transparent'
                  }`}
                >
                  Color
                </button>
                <button
                  type="button"
                  onClick={() => setCoverType('image')}
                  className={`font-mono-label text-xs pb-1 transition-colors cursor-pointer ${
                    coverType === 'image'
                      ? 'text-on-surface border-b-2 border-primary font-bold'
                      : 'text-secondary hover:text-on-surface border-b-2 border-transparent'
                  }`}
                >
                  Image
                </button>
              </div>
            </div>

            {coverType === 'color' ? (
              <div className="mt-2">
                <ColorPicker
                  colors={WORKSPACE_COLORS}
                  selectedColor={formData.color}
                  onChange={(color) => setFormData(prev => ({ ...prev, color }))}
                />
              </div>
            ) : (
              <div className="mt-2">
                <input
                  type="file"
                  id="coverImageUrl"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                />
                {coverPreview ? (
                  <div className="relative w-full h-32 rounded-DEFAULT overflow-hidden border border-outline-variant">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="absolute top-2 right-2 p-1 bg-surface-container-lowest/80 hover:bg-surface-container-lowest rounded-full text-on-surface border border-outline-variant text-xs flex items-center justify-center transition-colors"
                      title="Remove cover"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="coverImageUrl"
                    className="w-full h-32 border border-dashed border-outline-variant bg-surface-container-low hover:bg-surface-container transition-colors rounded-DEFAULT flex flex-col items-center justify-center cursor-pointer group"
                  >
                    <UploadCloud className="text-secondary group-hover:text-primary mb-2 transition-colors" size={24} />
                    <span className="font-body-sm text-xs text-secondary group-hover:text-on-surface transition-colors">
                      Click or drag image to upload
                    </span>
                    <span className="font-label-caps text-[10px] text-outline mt-1 uppercase font-bold">
                      JPEG, PNG OR WEBP (MAX 5MB)
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 rounded-DEFAULT bg-error-container border border-error text-on-error-container text-xs font-medium">
              {errors.submit}
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader size={16} className="animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              'Create Workspace'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkspaceForm;
