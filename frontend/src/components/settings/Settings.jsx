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
  { key: 'appearance', label: 'Appearance', icon: Palette },
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
    <div className="flex-1 overflow-hidden bg-bg-secondary">
      <div ref={scrollContainerRef} className="h-full overflow-y-auto p-8 sm:p-12">
        <div className="max-w-4xl mx-auto flex gap-12">
          <aside className="hidden lg:block w-48 shrink-0">
            <div className="sticky top-0">
              <h1 className="text-2xl font-bold text-text mb-1">Settings</h1>
              <p className="text-sm text-text-secondary mb-6">
                Manage your account
              </p>

              <nav className="space-y-0.5">
                {SECTIONS.map(({ key, label, icon: Icon }) => {
                  const isActive = activeSection === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleScrollToSection(key)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-button text-white'
                          : 'text-text-secondary hover:text-text hover:bg-bg-tertiary/50'
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="lg:hidden mb-6">
              <h1 className="text-2xl font-bold text-text mb-1">Settings</h1>
              <p className="text-sm text-text-secondary mb-4">
                Manage your account settings and preferences
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
                {SECTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleScrollToSection(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      activeSection === key
                        ? 'bg-button text-white'
                        : 'bg-bg text-text-secondary hover:text-text border border-border'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <section id="settings-profile" className="scroll-mt-8 rounded-xl border border-border bg-bg p-6">
              <ProfileTab />
            </section>

            <section id="settings-invitations" className="scroll-mt-8 rounded-xl border border-border bg-bg p-6">
              <InvitationsTab />
            </section>

            <section id="settings-security" className="scroll-mt-8 rounded-xl border border-border bg-bg p-6">
              <SecurityTab />
            </section>

            <section id="settings-appearance" className="scroll-mt-8 rounded-xl border border-border bg-bg p-6">
              <AppearanceTab />
            </section>

            <div className="h-40" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
