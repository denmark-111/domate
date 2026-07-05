import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MailIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { sendPasswordReset, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setIsSubmitting(true);
    const result = await sendPasswordReset(email);
    setIsSubmitting(false);

    if (result.success) {
      setIsSent(true);
    } else {
      setError(result.error || 'Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-button text-white font-bold mb-4">
            B
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">Board-Done</h1>
          <p className="text-text-secondary">
            {isSent ? 'Check your email' : 'Reset your password'}
          </p>
        </div>

        {isSent ? (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-label-done-bg border border-label-done-text text-center">
              <p className="text-label-done-text text-sm font-medium leading-relaxed">
                We&apos;ve sent a password reset link to <strong>{email}</strong>.
                Please check your inbox and follow the instructions.
              </p>
            </div>
            <p className="text-center text-text-secondary text-sm">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                onClick={() => { setIsSent(false); setError(''); }}
                className="text-text-accent font-semibold hover:underline"
              >
                try again
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-text-secondary text-sm mb-2">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-text mb-2">
                Email *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                  <MailIcon />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 outline-none transition-colors ${
                    error
                      ? 'border-error-border bg-error-bg focus:border-error-border'
                      : 'border-border bg-bg focus:border-input-border-focus'
                  }`}
                />
              </div>
              {error && (
                <p className="text-error-text text-sm mt-1">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-button hover:bg-button-hover disabled:bg-text-secondary text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <SpinnerIcon />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}

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

export default ForgotPassword;
