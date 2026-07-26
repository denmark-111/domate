import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LandingNavbar from './landing/LandingNavbar';
import HeroInteractivePreview from './landing/HeroInteractivePreview';
import InteractiveCommunicationStory from './landing/InteractiveCommunicationStory';
import LandingCTASection from './landing/LandingCTASection';
import LandingFooter from './landing/LandingFooter';
import { Zap, MessageSquare, Megaphone, Users } from 'lucide-react';

const Landing = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-button selection:text-white transition-colors duration-300">
      {/* Top Navbar */}
      <LandingNavbar />

      {/* Hero Section with Kanban Board Preview */}
      <HeroInteractivePreview />

      {/* Real-Time Team Communication Section (Pop & High Impact Story) */}
      <section id="demo-communication" className="py-16 md:py-24 max-w-7xl mx-auto px-6 relative">
        {/* Background glow behind communication section */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-button/5 to-transparent pointer-events-none -z-10 rounded-3xl" />

        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight mb-3">
            Streamline Team Communication
          </h2>
          <p className="text-base text-text-secondary leading-relaxed mb-6">
            Keep every teammate aligned with workspace-wide announcement broadcasts and instant live chat threads.
          </p>
        </div>

        {/* Communication Story Canvas */}
        <div className="max-w-3xl mx-auto">
          <InteractiveCommunicationStory />
        </div>
      </section>

      {/* Call to Action Section */}
      <LandingCTASection />

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default Landing;
