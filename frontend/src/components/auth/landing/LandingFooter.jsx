import AppLogo from '../../common/AppLogo';
import { useNavigate } from 'react-router-dom';

const LandingFooter = () => {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-border py-12 bg-bg transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <AppLogo size="xs" />
            <span className="font-extrabold text-lg tracking-tight text-text">Domate</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-text-secondary">
            <button onClick={() => navigate('/login')} className="hover:text-text transition">
              Sign In
            </button>
            <button onClick={() => navigate('/signup')} className="hover:text-text transition">
              Register
            </button>
            <a 
              href="https://github.com/denmark-111/domate" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-text transition"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="border-t border-border/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-tertiary">
          <p>&copy; {new Date().getFullYear()} Domate. Collaborative Workspaces.</p>
          <p>Built for modern high-speed team collaboration.</p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
