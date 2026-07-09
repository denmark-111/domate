import React, { useState } from 'react';

const parseEmails = (input) => {
  return input
    .split(/[,;\n\s]+/)
    .map(e => e.trim())
    .filter(e => e.length > 0);
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const InviteMembersForm = ({ workspaceName, onClose, onSubmit }) => {
  const [rawInput, setRawInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { created, alreadyMember, alreadyPending } or error

  const emails = parseEmails(rawInput);
  const invalidEmails = emails.filter(e => !isValidEmail(e));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validEmails = emails.filter(isValidEmail);
    if (validEmails.length === 0) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await onSubmit(validEmails);
      if (res.success) {
        setResult({ type: 'success', ...res.data });
        setRawInput('');
      } else {
        setResult({ type: 'error', message: res.error || 'Failed to send invitations' });
      }
    } catch (err) {
      setResult({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-bg rounded-xl shadow-lg w-full max-w-lg">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h2 className="text-base font-semibold text-text">Invite Members</h2>
          <p className="text-sm text-text-secondary mt-1">
            Send invites to {workspaceName}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="emails" className="block text-sm font-semibold text-text-secondary mb-1.5">
              Email Addresses
            </label>
            <textarea
              id="emails"
              value={rawInput}
              onChange={(e) => { setRawInput(e.target.value); setResult(null); }}
              rows="4"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text outline-none focus:border-input-border-focus transition-colors resize-none"
              placeholder="alice@example.com, bob@example.com"
            />
            <p className="text-xs text-text-secondary mt-1">
              Separate emails with commas, semicolons, or new lines. Max 20 at a time.
            </p>
          </div>

          {/* Inline validation */}
          {invalidEmails.length > 0 && (
            <div className="p-3 bg-error-bg border border-error-border rounded-lg text-sm text-error-text">
              Invalid email{invalidEmails.length > 1 ? 's' : ''}: {invalidEmails.join(', ')}
            </div>
          )}

          {/* Submission result */}
          {result?.type === 'success' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 space-y-1">
              <p className="font-semibold">Invitations sent!</p>
              {result.created > 0 && <p>• {result.created} invitation{result.created > 1 ? 's' : ''} created</p>}
              {result.alreadyMember > 0 && <p>• {result.alreadyMember} already {result.alreadyMember > 1 ? 'members' : 'a member'}</p>}
              {result.alreadyPending > 0 && <p>• {result.alreadyPending} already {result.alreadyPending > 1 ? 'have' : 'has'} a pending invite</p>}
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
              className="px-6 py-2 rounded-lg font-semibold text-text-secondary hover:bg-bg-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || emails.length === 0 || invalidEmails.length > 0}
              className="px-6 py-2 rounded-lg font-semibold bg-button hover:bg-button-hover text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting ? 'Sending...' : `Send ${emails.length > 0 ? `(${emails.length})` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMembersForm;
