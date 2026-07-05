import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const LockIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const CheckIcon = () => (
  <svg className="w-12 h-12 mx-auto text-label-done-text mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

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
      setTimeout(() => navigate('/auth'), 3000);
    } else {
      setError(result.error || 'Failed to reset password. Please try again.');
    }
  };

  if (isExpired) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-button text-white font-bold mb-4">
            B
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">Link Expired</h1>
          <p className="text-text-secondary mb-6">
            This password reset link has expired or is invalid. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-button hover:bg-button-hover text-white font-semibold rounded-lg transition-colors"
          >
            Request New Link
          </Link>
          <div className="mt-4">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-text-secondary hover:text-text font-medium transition-colors"
            >
              <ArrowLeftIcon />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isSessionReady) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-button text-white font-bold mb-4">
            B
          </div>
          <SpinnerIcon />
          <p className="text-text-secondary mt-4">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-button text-white font-bold mb-4">
            B
          </div>
          <CheckIcon />
          <h1 className="text-2xl font-bold text-text mb-2">Password Reset</h1>
          <p className="text-text-secondary mb-2">
            Your password has been successfully reset.
          </p>
          <p className="text-text-secondary text-sm">
            Redirecting you to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-button text-white font-bold mb-4">
            B
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">Set New Password</h1>
          <p className="text-text-secondary">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-semibold text-text mb-2">
              New Password *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                <LockIcon />
              </div>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 outline-none transition-colors ${
                  error
                    ? 'border-error-border bg-error-bg focus:border-error-border'
                    : 'border-border bg-bg focus:border-input-border-focus'
                }`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-text mb-2">
              Confirm New Password *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                <LockIcon />
              </div>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 outline-none transition-colors ${
                  error
                    ? 'border-error-border bg-error-bg focus:border-error-border'
                    : 'border-border bg-bg focus:border-input-border-focus'
                }`}
              />
            </div>
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
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text font-medium transition-colors"
          >
            <ArrowLeftIcon />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
