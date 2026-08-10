import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from 'lucide-react';

const RequireAuth = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader size={32} className="animate-spin text-secondary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectUrl = location.pathname !== '/' ? `/login?redirect=${encodeURIComponent(location.pathname + location.search)}` : '/login';
    return <Navigate to={redirectUrl} replace />;
  }

  return children;
};

export default RequireAuth;

