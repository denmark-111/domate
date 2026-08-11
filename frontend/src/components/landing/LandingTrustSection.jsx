const domateCapabilities = [
  'Live Kanban Boards',
  'Real-Time Cursors',
  'Workspace Chat',
  'Team Announcements',
  'Cross-Workspace Tasks'
];

const LandingTrustSection = () => {
  return (
    <section className="w-full border-b border-outline-variant bg-surface-container-lowest py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 flex flex-col items-center">
        <p className="font-label-caps text-xs font-bold text-secondary text-center mb-8 uppercase tracking-widest">
          Everything your team needs to stay aligned and execute in real-time
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-5">
          {domateCapabilities.map((capability) => (
            <div 
              key={capability}
              className="font-mono-label text-xs font-bold uppercase tracking-wider text-secondary border border-outline-variant rounded-DEFAULT px-4 py-2 bg-surface-container-low cursor-default select-none hover:border-primary hover:text-on-surface transition-colors"
            >
              {capability}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingTrustSection;
