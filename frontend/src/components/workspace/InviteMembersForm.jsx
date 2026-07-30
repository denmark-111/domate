import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="relative bg-bg rounded-t-xl sm:rounded-xl border border-border shadow-xl w-full sm:max-w-lg sm:mx-4 max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-text">Invite Members</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Send invites to <span className="font-medium text-text">{workspaceName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-text rounded-lg hover:bg-bg-tertiary transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="email-input" className="block text-sm font-semibold text-text-secondary mb-1.5">
              Email Addresses
            </label>

            <div 
              className="min-h-[100px] p-3 rounded-lg border border-border bg-bg hover:border-input-border-light focus-within:border-input-border-focus transition-colors flex flex-wrap items-start gap-2 cursor-text"
              onClick={() => document.getElementById('email-input')?.focus()}
            >
              {chips.map((email, idx) => {
                const valid = isValidEmail(email);
                return (
                  <span
                    key={`${email}-${idx}`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                      valid
                        ? 'bg-bg-tertiary text-text border border-border'
                        : 'bg-error-bg text-error-text border border-error-border'
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
                className="flex-1 min-w-[180px] bg-transparent text-sm text-text outline-none placeholder:text-text-tertiary py-0.5"
              />
            </div>
            
            <p className="text-xs text-text-secondary mt-1">
              Separate emails with commas, semicolons, space, or Enter.
            </p>
          </div>

          {/* Validation error */}
          {submitError && (
            <div className="p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error-text">
              {submitError}
            </div>
          )}

          {/* Submission result */}
          {result?.type === 'success' && (
            <div className="p-3 bg-label-done-bg border border-label-done-text/30 rounded-lg text-sm text-label-done-text space-y-1">
              <p className="font-semibold">Invitations sent!</p>
              {result.created > 0 && <p>• {result.created} invitation{result.created > 1 ? 's' : ''} created</p>}
              {result.alreadyMember > 0 && <p>• {result.alreadyMember} already member{result.alreadyMember > 1 ? 's' : ''}</p>}
              {result.alreadyPending > 0 && <p>• {result.alreadyPending} already pending</p>}
            </div>
          )}
          {result?.type === 'error' && (
            <div className="p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error-text">
              {result.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-text-secondary hover:bg-bg-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || allEmailsList.length === 0}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-button hover:bg-button-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

