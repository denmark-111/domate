import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SpinnerIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const SecurityTab = () => {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reauthRequired, setReauthRequired] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setReauthRequired(false);

    if (!newPassword) {
      setError('New password is required');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const result = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (result.success) {
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password updated successfully.');
    } else {
      const message = result.error || 'Failed to update password.';
      if (
        message.toLowerCase().includes('recently authenticated') ||
        message.toLowerCase().includes('reauthentication') ||
        message.toLowerCase().includes('reauth')
      ) {
        setReauthRequired(true);
      } else {
        setError(message);
      }
    }
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-bold text-text mb-4">Security</h2>

      {reauthRequired && (
        <div className="p-4 rounded-lg bg-error-bg border border-error-border mb-6">
          <div className="flex gap-3">
            <Info size={20} className="text-error-text shrink-0 mt-0.5" />
            <div>
              <p className="text-error-text text-sm font-semibold mb-1">Reauthentication Required</p>
              <p className="text-error-text text-sm leading-relaxed">
                For security reasons, please sign out and use the &quot;Forgot Password&quot; option on the login page to reset your password.
              </p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-label-done-bg border border-label-done-text mb-6">
          <p className="text-label-done-text text-sm font-medium">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-text-secondary">
          Update your password. You&apos;ll be signed out after changing it.
        </p>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-semibold text-text mb-2">
            New Password *
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError(''); setReauthRequired(false); }}
            placeholder="••••••••"
            className={`w-full px-4 py-2 rounded-lg border-2 outline-none transition-colors ${
              error
                ? 'border-error-border bg-error-bg focus:border-error-border'
                : 'border-border bg-bg focus:border-input-border-focus'
            }`}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-text mb-2">
            Confirm New Password *
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); setReauthRequired(false); }}
            placeholder="••••••••"
            className={`w-full px-4 py-2 rounded-lg border-2 outline-none transition-colors ${
              error
                ? 'border-error-border bg-error-bg focus:border-error-border'
                : 'border-border bg-bg focus:border-input-border-focus'
            }`}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error-bg border border-error-border">
            <p className="text-error-text text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-button hover:bg-button-hover disabled:bg-text-secondary text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <SpinnerIcon />
              Updating...
            </>
          ) : (
            'Update Password'
          )}
        </button>
      </form>
    </div>
  );
};

export default SecurityTab;
