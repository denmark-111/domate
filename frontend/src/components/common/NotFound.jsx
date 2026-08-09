import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';

const NotFound = () => {
  const navigate = useNavigate();
  let isAuthenticated = false;

  try {
    const auth = useAuth();
    isAuthenticated = auth?.isAuthenticated || false;
  } catch {
    isAuthenticated = false;
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(isAuthenticated ? '/dashboard' : '/');
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface dark:bg-background text-on-surface flex flex-col items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md flex flex-col items-center space-y-6">
        {/* Topbar-style Domate Branding */}
        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          className="font-headline-md text-xl sm:text-2xl font-bold text-on-surface tracking-tight select-none cursor-pointer"
        >
          Domate
        </Link>

        {/* Minimal Studio Slate Card */}
        <div className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-8 shadow-sm flex flex-col items-center text-center space-y-5">
          <span className="font-display text-6xl font-extrabold text-on-surface tracking-tight">
            404
          </span>

          <div className="space-y-1.5">
            <h1 className="font-headline-md text-lg font-bold text-on-surface">
              Page Not Found
            </h1>
            <p className="font-body-sm text-sm text-secondary leading-relaxed">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 w-full pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={handleGoBack}
              className="flex-1"
            >
              <ArrowLeft size={14} />
              <span>Go Back</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
              className="flex-1"
            >
              {isAuthenticated ? <LayoutDashboard size={14} /> : <Home size={14} />}
              <span>{isAuthenticated ? 'Dashboard' : 'Home'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
