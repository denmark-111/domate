import { useState } from 'react';
import { X } from 'lucide-react';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const parseEmails = (input) => {
  return input
    .split(/[,;\n\s]+/)
    .map(e => e.trim())
    .filter(e => e.length > 0);
};

const InviteMembersForm = ({ workspaceName, onClose, onSubmit }) => {
  const [rawInput, setRawInput] = useState('');
  const [chips, setChips] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const addChipsFromInput = (inputVal) => {
    const parsed = parseEmails(inputVal);
    if (parsed.length > 0) {
      setChips(prev => {
        const set = new Set([...prev, ...parsed]);
        return Array.from(set);
      });
      setRawInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (['Enter', ',', ';', ' '].includes(e.key)) {
      e.preventDefault();
      addChipsFromInput(rawInput);
    } else if (e.key === 'Backspace' && !rawInput && chips.length > 0) {
      setChips(prev => prev.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (rawInput.trim()) {
      addChipsFromInput(rawInput);
    }
  };

  const removeChip = (indexToRemove) => {
    setChips(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setSubmitError(null);
  };

  const getAllEmails = () => {
    const rawEmails = parseEmails(rawInput);
    const combined = Array.from(new Set([...chips, ...rawEmails]));
    return combined;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    const allEmails = getAllEmails();
    if (allEmails.length === 0) {
      setSubmitError('Please enter at least one email address.');
      return;
    }

    const invalid = allEmails.filter(email => !isValidEmail(email));
    if (invalid.length > 0) {
      setSubmitError(`Please correct invalid email address${invalid.length > 1 ? 'es' : ''}: ${invalid.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await onSubmit(allEmails);
      if (res.success) {
        setResult({ type: 'success', ...res.data });
        setChips([]);
        setRawInput('');
      } else {
        setResult({ type: 'error', message: res.error || 'Failed to send invitations' });
      }
    } catch {
      setResult({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allEmailsList = getAllEmails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-DEFAULT border border-outline-variant shadow-xl w-full max-w-lg mx-auto flex flex-col max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div>
            <h2 className="font-headline-md text-base font-bold text-on-surface">Invite Members</h2>
            <p className="font-body-sm text-xs text-secondary mt-0.5">
              Send invites to <span className="font-semibold text-on-surface">{workspaceName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-on-surface rounded-DEFAULT hover:bg-surface-container-low transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="email-input" className="block font-mono-label text-xs uppercase font-bold text-on-surface mb-1.5">
              Email Addresses
            </label>

            <div 
              className="min-h-[100px] p-3 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest focus-within:border-primary transition-colors flex flex-wrap items-start gap-2 cursor-text"
              onClick={() => document.getElementById('email-input')?.focus()}
            >
              {chips.map((email, idx) => {
                const valid = isValidEmail(email);
                return (
                  <span
                    key={`${email}-${idx}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-DEFAULT text-xs font-mono-label ${
                      valid
                        ? 'bg-surface-container-low text-on-surface border border-outline-variant'
                        : 'bg-error-container text-on-error-container border border-error'
                    }`}
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeChip(idx);
                      }}
                      className="hover:opacity-75 p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                );
              })}

              <input
                id="email-input"
                type="text"
                value={rawInput}
                onChange={(e) => {
                  setRawInput(e.target.value);
                  setSubmitError(null);
                  setResult(null);
                }}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder={chips.length === 0 ? "Enter email addresses (comma, space, or Enter)" : "Add more..."}
                className="flex-1 min-w-[180px] bg-transparent text-sm font-body-sm text-on-surface outline-none placeholder:text-outline py-0.5"
              />
            </div>
            
            <p className="font-body-sm text-xs text-secondary mt-1">
              Separate emails with commas, semicolons, space, or Enter.
            </p>
          </div>

          {/* Validation error */}
          {submitError && (
            <div className="p-3 bg-error-container border border-error rounded-DEFAULT text-xs text-on-error-container font-medium">
              {submitError}
            </div>
          )}

          {/* Submission result */}
          {result?.type === 'success' && (
            <div className="p-3 bg-surface-container-low border border-outline-variant rounded-DEFAULT text-xs text-on-surface space-y-1">
              <p className="font-bold">Invitations sent!</p>
              {result.created > 0 && <p>• {result.created} invitation{result.created > 1 ? 's' : ''} created</p>}
              {result.alreadyMember > 0 && <p>• {result.alreadyMember} already member{result.alreadyMember > 1 ? 's' : ''}</p>}
              {result.alreadyPending > 0 && <p>• {result.alreadyPending} already pending</p>}
            </div>
          )}
          {result?.type === 'error' && (
            <div className="p-3 bg-error-container border border-error rounded-DEFAULT text-xs text-on-error-container font-medium">
              {result.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-DEFAULT font-label-caps text-xs font-bold uppercase text-secondary hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || allEmailsList.length === 0}
              className="px-4 py-2 rounded-DEFAULT font-label-caps text-xs font-bold uppercase bg-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : `Send ${allEmailsList.length > 0 ? `(${allEmailsList.length})` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMembersForm;

