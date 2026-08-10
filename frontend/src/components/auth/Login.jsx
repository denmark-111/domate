import { useState } from 'react';
import { useNavigate, Navigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, Loader } from 'lucide-react';
import AuthCard from './AuthCard';
import Input from '../common/Input';
import Button from '../common/Button';

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';
  const { login, loginWithOAuth, isAuthenticated, isLoading } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthProvider, setOauthProvider] = useState('');

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to={redirectTarget} replace />;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setOauthProvider('');
    setErrors({});

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate(redirectTarget);
      } else {
        setErrors({ submit: result.error || 'Login failed. Please check your credentials.' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ submit: 'Login failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider) => {
    setIsSubmitting(true);
    setOauthProvider(provider);
    setErrors({});

    let shouldStayLoading = false;
    try {
      const result = await loginWithOAuth(provider);
      if (result.success) {
        shouldStayLoading = true;
      } else {
        setErrors({ submit: `${provider} login failed. Please try again.` });
      }
    } catch (error) {
      console.error(`${provider} OAuth error:`, error);
      setErrors({ submit: `${provider} login failed. Please try again.` });
    } finally {
      if (!shouldStayLoading) {
        setIsSubmitting(false);
        setOauthProvider('');
      }
    }
  };

  return (
    <AuthCard
      subtitle="Welcome back! Log in to your workspace."
      footer={
        <p className="font-body-sm text-xs text-secondary">
          Don&apos;t have an account?{' '}
          <Link
            to={redirectTarget !== '/dashboard' ? `/signup?redirect=${encodeURIComponent(redirectTarget)}` : '/signup'}
            className="text-on-surface font-semibold hover:underline"
          >
            Sign up
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <Input
          label="Email address"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="you@example.com"
          icon={Mail}
          error={errors.email}
        />

        {/* Password */}
        <div>
          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            icon={Lock}
            error={errors.password}
          />
          <div className="mt-1.5 text-right">
            <Link
              to="/forgot-password"
              className="font-body-sm text-xs text-secondary hover:text-on-surface transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Error Banner */}
        {errors.submit && (
          <div className="p-3 rounded-DEFAULT bg-error-container/40 border border-error text-on-error-container text-xs font-body-sm">
            {errors.submit}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          disabled={isSubmitting}
        >
          {isSubmitting && !oauthProvider ? (
            <>
              <Loader size={16} className="animate-spin" />
              Logging in...
            </>
          ) : (
            <>
              Login
              <ArrowRight size={16} />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-outline-variant"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase font-mono-label">
          <span className="px-2 bg-surface-container-lowest text-secondary">
            Or continue with
          </span>
        </div>
      </div>

      {/* OAuth Button */}
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => handleOAuth('google')}
        disabled={isSubmitting}
      >
        {oauthProvider === 'google' ? (
          <>
            <Loader size={16} className="animate-spin" />
            Connecting to Google...
          </>
        ) : (
          <>
            <GoogleIcon />
            Continue with Google
          </>
        )}
      </Button>
    </AuthCard>
  );
};

export default Login;
