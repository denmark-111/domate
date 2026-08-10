import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowLeft, Loader } from 'lucide-react';
import AuthCard from './AuthCard';
import Input from '../common/Input';
import Button from '../common/Button';

const ForgotPassword = () => {
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
      setError('Please enter a valid email address');
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
    <AuthCard
      subtitle={isSent ? 'Check your email' : 'Reset your password'}
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
      {isSent ? (
        <div className="space-y-4">
          <div className="p-4 rounded-DEFAULT bg-surface-container-high border border-outline-variant text-center">
            <p className="font-body-sm text-xs text-on-surface leading-relaxed">
              We&apos;ve sent a password reset link to <strong>{email}</strong>.
              Please check your inbox and follow the instructions.
            </p>
          </div>
          <p className="text-center font-body-sm text-xs text-secondary">
            Didn&apos;t receive the email? Check your spam folder or{' '}
            <button
              onClick={() => { setIsSent(false); setError(''); }}
              className="text-on-surface font-semibold hover:underline cursor-pointer"
            >
              try again
            </button>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="font-body-sm text-xs text-secondary mb-2">
            Enter your account email and we&apos;ll send you a link to reset your password.
          </p>

          <Input
            label="Email address"
            id="email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="you@example.com"
            icon={Mail}
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
                Sending link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </form>
      )}
    </AuthCard>
  );
};

export default ForgotPassword;

