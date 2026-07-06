import { useState } from 'react';
import { Info, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SecurityTab = () => {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reauthRequired, setReauthRequired] = useState(false);

  const isDirty = newPassword.length > 0 || confirmPassword.length > 0;

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
    <div>
      <h2 className="text-base font-semibold text-text mb-1">Security</h2>
      <p className="text-sm text-text-secondary mb-6">
        Update your password to keep your account secure.
      </p>

      {reauthRequired && (
        <div className="p-4 rounded-lg bg-error-bg border border-error-border mb-4">
          <div className="flex gap-3">
            <Info size={18} className="text-error-text shrink-0 mt-0.5" />
            <div>
              <p className="text-error-text text-sm font-semibold mb-1">Reauthentication required</p>
              <p className="text-error-text text-sm leading-relaxed">
                For security reasons, please sign out and use the &quot;Forgot Password&quot; option on the login page to reset your password.
              </p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-label-done-bg border border-label-done-text mb-4">
          <p className="text-label-done-text text-sm font-medium">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="max-w-sm space-y-3">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-text mb-1.5">
              New password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); setReauthRequired(false); }}
              placeholder="At least 6 characters"
              className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${
                error
                  ? 'border-error-border bg-error-bg focus:border-error-border'
                  : 'border-border bg-bg focus:border-input-border-focus'
              }`}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text mb-1.5">
              Confirm new password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); setReauthRequired(false); }}
              placeholder="Re-enter your password"
              className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${
                error
                  ? 'border-error-border bg-error-bg focus:border-error-border'
                  : 'border-border bg-bg focus:border-input-border-focus'
              }`}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error-bg border border-error-border max-w-sm">
            <p className="text-error-text text-sm">{error}</p>
          </div>
        )}

        {isDirty && (
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-button hover:bg-button-hover disabled:opacity-50 text-white transition-colors disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <Loader size={14} className="animate-spin" />}
              Update password
            </button>
            <button
              type="button"
              onClick={() => { setNewPassword(''); setConfirmPassword(''); setError(''); }}
              className="px-5 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text hover:bg-bg-tertiary transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SecurityTab;
