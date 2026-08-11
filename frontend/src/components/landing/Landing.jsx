import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LandingNavbar from './LandingNavbar';
import LandingHero from './LandingHero';
import LandingTrustSection from './LandingTrustSection';
import LandingFeaturesSection from './LandingFeaturesSection';
import LandingFooter from './LandingFooter';

const Landing = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans transition-colors duration-200">
      <LandingNavbar />
      <main className="flex-grow flex flex-col items-center w-full">
        <LandingHero />
        <LandingTrustSection />
        <LandingFeaturesSection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Landing;
