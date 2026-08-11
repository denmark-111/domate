import { useNavigate } from 'react-router-dom';

const LandingHero = () => {
  const navigate = useNavigate();

  const handleScrollToDemo = () => {
    const demoElement = document.getElementById('live-demo');
    if (demoElement) {
      demoElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full border-b border-outline-variant py-20 sm:py-28 md:py-36 bg-background flex flex-col items-center justify-center text-center px-4 sm:px-6 md:px-12">
      <div className="max-w-4xl flex flex-col items-center">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-on-surface mb-6 tracking-tight leading-[1.1]">
          Work, Conversations & Updates. All in One Place.
        </h1>

        <p className="font-body-lg text-lg sm:text-xl text-secondary max-w-2xl mb-10 leading-relaxed">
          Domate brings real-time Kanban boards, chat, and team announcements directly into your workspace, keeping your work and conversations in sync.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate('/signup')}
            className="bg-primary text-on-primary rounded-DEFAULT font-label-caps text-xs font-bold uppercase tracking-wider px-8 py-4 hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            Get Started Free
          </button>

          <button
            onClick={handleScrollToDemo}
            className="bg-transparent text-on-surface border border-outline-variant rounded-DEFAULT font-label-caps text-xs font-bold uppercase tracking-wider px-8 py-4 hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            View Live Demo
          </button>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
