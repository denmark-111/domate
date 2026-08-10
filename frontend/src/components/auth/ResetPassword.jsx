import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Lock, ArrowLeft, Loader, CheckCircle } from 'lucide-react';
import AuthCard from './AuthCard';
import Input from '../common/Input';
import Button from '../common/Button';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword, isAuthenticated } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const hasSessionRef = useRef(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('error=')) {
      setIsExpired(true);
      return;
    }

    if (isAuthenticated) {
      hasSessionRef.current = true;
      setIsSessionReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        hasSessionRef.current = true;
        setIsSessionReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        hasSessionRef.current = true;
        setIsSessionReady(true);
      }
    });

    const timeout = setTimeout(() => {
      if (!hasSessionRef.current) {
        setIsExpired(true);
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
      setIsSuccess(true);
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setError(result.error || 'Failed to reset password. Please try again.');
    }
  };

  if (isExpired) {
    return (
      <AuthCard
        subtitle="Link Expired"
        footer={
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-body-sm text-xs text-secondary hover:text-on-surface transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Login
          </Link>
        }
      >
        <div className="text-center space-y-4 py-2">
          <p className="font-body-sm text-xs text-secondary">
            This password reset link has expired or is invalid. Please request a new link.
          </p>
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => navigate('/forgot-password')}
          >
            Request New Link
          </Button>
        </div>
      </AuthCard>
    );
  }

  if (!isSessionReady) {
    return (
      <AuthCard subtitle="Verifying Reset Link">
        <div className="text-center py-8 space-y-3">
          <Loader size={24} className="animate-spin mx-auto text-secondary" />
          <p className="font-body-sm text-xs text-secondary">Verifying your reset link...</p>
        </div>
      </AuthCard>
    );
  }

  if (isSuccess) {
    return (
      <AuthCard subtitle="Password Reset Complete">
        <div className="text-center py-6 space-y-3">
          <CheckCircle size={40} className="mx-auto text-on-surface mb-2" />
          <h2 className="font-headline-md text-lg font-bold text-on-surface">Password Reset</h2>
          <p className="font-body-sm text-xs text-secondary">
            Your password has been successfully reset. Redirecting you to login...
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      subtitle="Enter your new password below."
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-body-sm text-xs text-secondary hover:text-on-surface transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
          placeholder="••••••••"
          icon={Lock}
        />

        <Input
          label="Confirm New Password"
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
          placeholder="••••••••"
          icon={Lock}
          error={error}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader size={16} className="animate-spin" />
              Resetting...
            </>
          ) : (
            'Reset Password'
          )}
        </Button>
      </form>
    </AuthCard>
  );
};

export default ResetPassword;

