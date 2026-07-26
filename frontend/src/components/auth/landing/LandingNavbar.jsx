import { useNavigate } from 'react-router-dom';
import AppLogo from '../../common/AppLogo';
import { useTheme } from '../../../context/ThemeContext';
import { Sun, Moon, Sparkles } from 'lucide-react';

const LandingNavbar = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bg/80 border-b border-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="group-hover:scale-105 transition-transform duration-200">
            <AppLogo size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-button to-purple-600 bg-clip-text text-transparent">
              Domate
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-border bg-bg-secondary hover:bg-bg-tertiary text-text-secondary hover:text-text transition-all duration-200"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} className="text-indigo-600" />
            )}
          </button>

          <button
            onClick={() => navigate('/auth')}
            className="hidden sm:inline-flex px-4 py-2 rounded-xl border border-border text-text font-medium hover:bg-bg-secondary transition-all duration-200"
          >
            Sign In
          </button>

          <button
            onClick={() => navigate('/auth?action=register')}
            className="px-4 py-2 rounded-xl bg-button hover:bg-button-hover text-white font-medium shadow-md shadow-button/20 hover:shadow-button/40 transition-all duration-200"
          >
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
};

export default LandingNavbar;
