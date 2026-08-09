import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Mail, Shield, Palette } from 'lucide-react';
import ProfileTab from './ProfileTab';
import InvitationsTab from './InvitationsTab';
import SecurityTab from './SecurityTab';
import AppearanceTab from './AppearanceTab';

const SECTIONS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'invitations', label: 'Invitations', icon: Mail },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'appearance', label: 'Appearance', icon: Palette }
];

const Settings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const scrollContainerRef = useRef(null);
  const isClickScrolling = useRef(false);

  const handleScrollToSection = useCallback((sectionKey) => {
    const element = document.getElementById(`settings-${sectionKey}`);
    if (!element) return;

    isClickScrolling.current = true;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setActiveSection(sectionKey);

    setTimeout(() => {
      isClickScrolling.current = false;
    }, 800);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isClickScrolling.current) return;

      const { scrollTop } = container;
      const offset = scrollTop + 120;

      let current = SECTIONS[0].key;
      for (const { key } of SECTIONS) {
        const el = document.getElementById(`settings-${key}`);
        if (el && el.offsetTop <= offset) {
          current = key;
        }
      }

      setActiveSection(current);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex-1 overflow-hidden bg-surface flex flex-col min-w-0">
      <div ref={scrollContainerRef} className="h-full overflow-y-auto">
        <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 lg:gap-12 items-start">
            {/* Desktop Sticky Header & Nav */}
            <aside className="hidden lg:block sticky top-8 md:top-10 shrink-0">
              <div className="mb-6">
                <h1 className="font-headline-lg text-2xl font-semibold text-on-surface tracking-tight mb-1">
                  Settings
                </h1>
                <p className="font-body-sm text-xs text-secondary leading-relaxed">
                  Manage your account preferences, security, and appearance.
                </p>
              </div>

              <nav className="space-y-1">
                {SECTIONS.map(({ key, label, icon: Icon }) => {
                  const isActive = activeSection === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleScrollToSection(key)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-DEFAULT font-label-caps text-xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary text-on-primary shadow-2xs'
                          : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Main Content Area */}
            <main className="min-w-0 space-y-8">
              {/* Mobile Header & Sticky Pill Nav */}
              <div className="lg:hidden">
                <div className="mb-4">
                  <h1 className="font-headline-lg text-2xl font-semibold text-on-surface tracking-tight mb-1">
                    Settings
                  </h1>
                  <p className="font-body-sm text-xs text-secondary">
                    Manage your account preferences, security, and appearance.
                  </p>
                </div>

                <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-xs py-2 mb-6 border-b border-outline-variant flex overflow-x-auto gap-2 thin-scrollbar">
                  {SECTIONS.map(({ key, label, icon: Icon }) => {
                    const isActive = activeSection === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleScrollToSection(key)}
                        className={`font-label-caps text-xs font-bold uppercase tracking-wider flex items-center gap-2 px-3.5 py-2 rounded-DEFAULT whitespace-nowrap transition-all ${
                          isActive
                            ? 'bg-primary text-on-primary shadow-2xs'
                            : 'bg-surface-container-lowest text-secondary border border-outline-variant hover:text-on-surface'
                        }`}
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <section
                id="settings-profile"
                className="scroll-mt-8 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest p-6 sm:p-8 shadow-2xs"
              >
                <ProfileTab />
              </section>

              <section
                id="settings-invitations"
                className="scroll-mt-8 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest p-6 sm:p-8 shadow-2xs"
              >
                <InvitationsTab />
              </section>

              <section
                id="settings-security"
                className="scroll-mt-8 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest p-6 sm:p-8 shadow-2xs"
              >
                <SecurityTab />
              </section>

              <section
                id="settings-appearance"
                className="scroll-mt-8 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest p-6 sm:p-8 shadow-2xs"
              >
                <AppearanceTab />
              </section>

              <div className="h-20" />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;


