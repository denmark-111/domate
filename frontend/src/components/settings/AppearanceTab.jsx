import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const THEME_OPTIONS = [
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon },
];

const AppearanceTab = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-headline-md text-lg font-semibold text-on-surface mb-1">
          Appearance & Theme
        </h2>
        <p className="font-body-sm text-sm text-secondary">
          Customize how Domate looks on your device.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setTheme(option.key)}
              className={`flex flex-col items-center gap-3 p-6 rounded-DEFAULT transition-all cursor-pointer ${
                isActive
                  ? 'border-2 border-primary bg-surface-container-lowest text-on-surface shadow-xs'
                  : 'border border-outline-variant bg-surface-container-low text-secondary hover:border-outline hover:text-on-surface'
              }`}
            >
              <Icon
                size={24}
                className={isActive ? 'text-primary' : 'text-secondary'}
              />
              <span
                className={`font-label-caps text-xs font-bold uppercase tracking-wider ${
                  isActive ? 'text-on-surface' : 'text-secondary'
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AppearanceTab;

