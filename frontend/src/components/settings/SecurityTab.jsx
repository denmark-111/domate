import { useState } from 'react';
import { Info, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Input from '../common/Input';

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
      <div className="mb-6">
        <h2 className="font-headline-md text-lg font-semibold text-on-surface mb-1">
          Security & Password
        </h2>
        <p className="font-body-sm text-sm text-secondary">
          Update your password to keep your account safe and secure.
        </p>
      </div>

      {reauthRequired && (
        <div className="p-4 rounded-DEFAULT bg-error-container border border-error/30 text-on-error-container mb-6 flex gap-3.5 items-start">
          <Info size={18} className="text-error shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-headline-md text-sm font-semibold text-on-error-container">
              Reauthentication required
            </h3>
            <p className="font-body-sm text-xs leading-relaxed text-on-error-container/90">
              For security reasons, please sign out and use the &quot;Forgot Password&quot; link on the login page to reset your credentials.
            </p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-DEFAULT bg-surface-container-high border border-outline-variant text-on-surface text-sm font-medium mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="max-w-md space-y-4">
          <Input
            id="newPassword"
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setError(''); setReauthRequired(false); }}
            placeholder="At least 6 characters"
            error={error && !newPassword ? error : undefined}
          />

          <Input
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); setReauthRequired(false); }}
            placeholder="Re-enter your password"
            error={error && newPassword && confirmPassword !== newPassword ? error : undefined}
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-DEFAULT bg-error-container border border-error/30 max-w-md text-on-error-container text-xs font-medium">
            {error}
          </div>
        )}

        {isDirty && (
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader size={14} className="animate-spin" />}
              Update password
            </Button>
            <Button
              type="button"
              variant="subtle"
              onClick={() => { setNewPassword(''); setConfirmPassword(''); setError(''); }}
            >
              Cancel
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SecurityTab;

