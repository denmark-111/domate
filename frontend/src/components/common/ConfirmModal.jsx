import { X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', isLoading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div
        className="relative bg-surface-container-lowest rounded-DEFAULT border border-outline-variant p-5 sm:p-6 shadow-xl max-w-md w-full overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-on-surface transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
        <h3 className="font-headline-md text-base sm:text-lg font-bold text-on-surface mb-2 pr-6">{title}</h3>
        <p className="font-body-sm text-sm text-secondary mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 sm:flex-none px-4 py-2 font-label-caps text-xs font-bold uppercase rounded-DEFAULT border border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 sm:flex-none px-4 py-2 font-label-caps text-xs font-bold uppercase rounded-DEFAULT bg-error text-on-error hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;