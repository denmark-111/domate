import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const THEME_OPTIONS = [
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon },
];

const AppearanceTab = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-bold text-text mb-4">Appearance</h2>
      <p className="text-sm text-text-secondary mb-6">
        Customize how the application looks on your device.
      </p>

      <label className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 block">
        Theme
      </label>

      <div className="grid grid-cols-2 gap-3">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.key;
          return (
            <button
              key={option.key}
              onClick={() => setTheme(option.key)}
              className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                isActive
                  ? 'border-button bg-button/10'
                  : 'border-border bg-bg-secondary hover:border-border-light'
              }`}
            >
              <Icon
                size={28}
                className={isActive ? 'text-button' : 'text-text-secondary'}
              />
              <span
                className={`font-semibold text-sm ${
                  isActive ? 'text-button' : 'text-text'
                }`}
              >
                {option.label}
              </span>
              {isActive && (
                <span className="text-xs text-button font-medium">Active</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AppearanceTab;
