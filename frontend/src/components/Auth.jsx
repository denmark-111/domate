import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Inline SVG Icons
const MailIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const GithubIcon = () => (
  <svg className="w-[20px] h-[20px]" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const { login, register, loginWithOAuth } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

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
    setSubmitMessage('');

    try {
      let result;

      if (isLoginMode) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.fullName, formData.email, formData.password);
      }

      if (result.success) {
        const action = isLoginMode ? 'Login' : 'Registration';
        setSubmitMessage(`${action} successful! Redirecting...`);
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/');
        }, 1500);
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
    try {
      const result = await loginWithOAuth(provider);
      if (result.success) {
        setSubmitMessage(`${provider} login successful! Redirecting...`);
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setErrors({ submit: `${provider} login failed. Please try again.` });
      }
    } catch (error) {
      console.error(`${provider} OAuth error:`, error);
      setErrors({ submit: `${provider} login failed. Please try again.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-button text-white font-bold mb-4">
            B
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">Board-Done</h1>
          <p className="text-text-secondary">
            {isLoginMode ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-bg-secondary p-1 rounded-lg">
          <button
            onClick={() => {
              setIsLoginMode(true);
              setErrors({});
              setSubmitMessage('');
            }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              isLoginMode
                ? 'bg-button text-white'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsLoginMode(false);
              setErrors({});
              setSubmitMessage('');
            }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              !isLoginMode
                ? 'bg-button text-white'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-8">
          <button
            onClick={() => handleOAuth('google')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-border rounded-lg hover:bg-bg-secondary transition-colors font-medium text-text"
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <button
            onClick={() => handleOAuth('github')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-border rounded-lg hover:bg-bg-secondary transition-colors font-medium text-text"
          >
            <GithubIcon />
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-bg text-text-secondary">Or continue with email</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name (Registration Only) */}
          {!isLoginMode && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-text mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className={`w-full px-4 py-2 rounded-lg border-2 outline-none transition-colors ${
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
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 outline-none transition-colors ${
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
            <label htmlFor="password" className="block text-sm font-semibold text-text mb-2">
              Password *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                <LockIcon />
              </div>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 outline-none transition-colors ${
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
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-text mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                  <LockIcon />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 outline-none transition-colors ${
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
              <button type="button" className="text-text-accent hover:underline">
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-button hover:bg-button-hover disabled:bg-text-secondary text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isLoginMode ? 'Logging in...' : 'Creating account...'}
              </>
            ) : (
              <>
                {isLoginMode ? 'Login' : 'Create Account'}
                <ArrowRightIcon />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-text-secondary text-sm mt-6">
          {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setErrors({});
              setSubmitMessage('');
            }}
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
