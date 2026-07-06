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
      <h2 className="text-base font-semibold text-text mb-1">Appearance</h2>
      <p className="text-sm text-text-secondary mb-6">
        Customize how the application looks on your device.
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-sm">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.key;
          return (
            <button
              key={option.key}
              onClick={() => setTheme(option.key)}
              className={`flex flex-col items-center gap-2.5 p-5 rounded-xl border transition-all ${
                isActive
                  ? 'border-button bg-button/5'
                  : 'border-border bg-bg-secondary hover:border-border-light'
              }`}
            >
              <Icon
                size={22}
                className={isActive ? 'text-button' : 'text-text-secondary'}
              />
              <span
                className={`text-sm font-medium ${
                  isActive ? 'text-button' : 'text-text'
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
