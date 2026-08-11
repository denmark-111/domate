import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const LandingNavbar = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-surface-container-lowest w-full top-0 border-b border-outline-variant z-50 sticky">
      <div className="flex justify-between items-center w-full px-4 sm:px-6 md:px-12 py-3.5 max-w-7xl mx-auto">
        {/* Brand */}
        <div 
          onClick={() => navigate('/')} 
          className="font-headline-md text-xl sm:text-2xl font-bold tracking-tight text-on-surface cursor-pointer select-none"
        >
          Domate
        </div>

        {/* Actions */}
        <div className="flex gap-3 sm:gap-4 items-center">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-DEFAULT border border-outline-variant bg-surface-container-low hover:bg-surface-container-high text-secondary hover:text-on-surface transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} className="text-on-surface" />
            )}
          </button>

          <button
            onClick={() => navigate('/login')}
            className="font-label-caps text-xs font-bold uppercase tracking-wider text-secondary hover:text-on-surface transition-colors cursor-pointer bg-transparent border-none px-3 py-2"
          >
            Sign In
          </button>

          <button
            onClick={() => navigate('/signup')}
            className="font-label-caps text-xs font-bold uppercase tracking-wider bg-primary text-on-primary rounded-DEFAULT px-4 py-2 hover:opacity-90 transition-opacity cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
