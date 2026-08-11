import { useNavigate } from 'react-router-dom';

const LandingFooter = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-surface-container-lowest w-full border-t border-outline-variant py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Left: Brand & Copyright */}
        <div className="flex items-baseline gap-3">
          <span 
            onClick={() => navigate('/')}
            className="font-headline-md text-base font-bold text-on-surface cursor-pointer select-none tracking-tight hover:opacity-80 transition-opacity leading-none"
          >
            Domate
          </span>
          <span className="text-outline-variant font-mono-label text-xs leading-none">&bull;</span>
          <span className="font-mono-label text-xs uppercase tracking-widest text-secondary leading-none">
            &copy; {new Date().getFullYear()} Domate
          </span>
        </div>

        {/* Right: Action Links (Pixel-perfect flex alignment) */}
        <div className="flex items-center gap-6 font-mono-label text-xs uppercase tracking-widest leading-none">
          <button 
            onClick={() => navigate('/login')} 
            className="inline-flex items-center text-secondary hover:text-on-surface transition-colors cursor-pointer bg-transparent border-none p-0 leading-none font-mono-label text-xs uppercase tracking-widest"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/signup')} 
            className="inline-flex items-center text-secondary hover:text-on-surface transition-colors cursor-pointer bg-transparent border-none p-0 leading-none font-mono-label text-xs uppercase tracking-widest"
          >
            Get Started
          </button>
          <a 
            href="https://github.com/denmark-111/domate" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center text-secondary hover:text-on-surface transition-colors leading-none font-mono-label text-xs uppercase tracking-widest"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
