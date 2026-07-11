import { useState } from 'react';
import { useNavigate, Navigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, Loader } from 'lucide-react';
import AppLogo from '../common/AppLogo';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, loginWithOAuth, isAuthenticated, isLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(searchParams.get('action') !== 'register');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthProvider, setOauthProvider] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  // Redirect already-authenticated users to dashboard
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleModeSwitch = (mode) => {
    setIsLoginMode(mode);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: ''
    });
    setErrors({});
    setSubmitMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLoginMode) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setOauthProvider('');
    setSubmitMessage('');

    try {
      let result;

      if (isLoginMode) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.fullName, formData.email, formData.password);
      }

      if (result.success) {
        if (isLoginMode) {
          navigate('/dashboard');
        } else {
          const hasSession = result.data?.session;
          setSubmitMessage(hasSession ? '' : 'Account created. Check your email to confirm your account.');
          if (hasSession) {
            navigate('/dashboard');
          } else {
            setFormData({
              email: '',
              password: '',
              confirmPassword: '',
              fullName: ''
            });
          }
        }
      } else {
        setErrors({ submit: result.error || `${isLoginMode ? 'Login' : 'Registration'} failed. Please try again.` });
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ submit: `${isLoginMode ? 'Login' : 'Registration'} failed. Please try again.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = async (provider) => {
    setIsSubmitting(true);
    setOauthProvider(provider);
    setErrors({});
    setSubmitMessage('');

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
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <AppLogo className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-text mb-2">Domate</h1>
          <p className="text-text-secondary">
            {isLoginMode ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name (Registration Only) */}
          {!isLoginMode && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-text-secondary mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-colors ${
                  errors.fullName
                    ? 'border-error-border bg-error-bg focus:border-error-border'
                    : 'border-border bg-bg focus:border-input-border-focus'
                }`}
              />
              {errors.fullName && (
                <p className="text-error-text text-sm mt-1">{errors.fullName}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-text-secondary mb-1.5">
              Email *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                <Mail size={18} />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none transition-colors ${
                  errors.email
                    ? 'border-error-border bg-error-bg focus:border-error-border'
                    : 'border-border bg-bg focus:border-input-border-focus'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-error-text text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-text-secondary mb-1.5">
              Password *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                <Lock size={18} />
              </div>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none transition-colors ${
                  errors.password
                    ? 'border-error-border bg-error-bg focus:border-error-border'
                    : 'border-border bg-bg focus:border-input-border-focus'
                }`}
              />
            </div>
            {errors.password && (
              <p className="text-error-text text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password (Registration Only) */}
          {!isLoginMode && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-text-secondary mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none transition-colors ${
                    errors.confirmPassword
                      ? 'border-error-border bg-error-bg focus:border-error-border'
                      : 'border-border bg-bg focus:border-input-border-focus'
                  }`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-error-text text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 rounded-lg bg-error-bg border border-error-border">
              <p className="text-error-text text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Success Message */}
          {submitMessage && (
            <div className="p-3 rounded-lg bg-label-done-bg border border-label-done-text">
              <p className="text-label-done-text text-sm font-medium">{submitMessage}</p>
            </div>
          )}

          {/* Login Helper Links */}
          {isLoginMode && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" />
                <span className="text-text-secondary">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-text-accent hover:underline">
                Forgot password?
              </Link>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-button hover:bg-button-hover disabled:opacity-50 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader size={20} className="animate-spin" />
                {oauthProvider ? 'Please wait...' : isLoginMode ? 'Logging in...' : 'Creating account...'}
              </>
            ) : (
              <>
                {isLoginMode ? 'Login' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-bg text-text-secondary">Or continue with:</span>
          </div>
        </div>

        {/* OAuth */}
        <button
          onClick={() => handleOAuth('google')}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg hover:bg-bg-secondary transition-colors font-medium text-text disabled:cursor-not-allowed disabled:opacity-50"
        >
          {oauthProvider === 'google' ? (
            <>
              <Loader size={20} className="animate-spin" />
              Connecting to Google...
            </>
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>

        {/* Footer */}
        <p className="text-center text-text-secondary text-sm mt-6">
          {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => handleModeSwitch(!isLoginMode)}
            className="text-text-accent font-semibold hover:underline"
          >
            {isLoginMode ? 'Sign up' : 'Login'}
          </button>
        </p>

        {/* Terms */}
        <p className="text-center text-text-secondary text-xs mt-6">
          By continuing, you agree to our{' '}
          <button className="text-text-accent hover:underline">Terms of Service</button>
          {' '}and{' '}
          <button className="text-text-accent hover:underline">Privacy Policy</button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
