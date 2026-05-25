import React from 'react';
import { Bell, Settings, Search, Sun, Moon } from 'lucide-react'; // Import Sun and Moon icons
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext'; // Import useTheme hook

const Topbar = () => {
  const { activeWorkspace, activeView, activeBoard } = useWorkspace();
  const { theme, toggleTheme } = useTheme(); // Use the theme context

  return (
    <header className="h-16 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] flex items-center justify-between px-8 z-10">
      <div className="flex items-center gap-4">
        <div className="relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-text-blue-600)] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search tasks, boards..." 
            className="pl-10 pr-4 py-2 bg-[var(--color-bg-secondary)] border border-transparent rounded-lg text-sm focus:outline-none focus:bg-[var(--color-bg-primary)] focus:border-[var(--color-border-blue-500)] transition-all w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] rounded-full transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div className="flex items-center gap-2 pr-6 border-r border-[var(--color-border-gray-100)]">
          <button className="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] rounded-full transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-text-red-600)] border-2 border-white rounded-full"></span>
          </button>
          <button className="p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] rounded-full transition-colors">
            <Settings size={20} />
          </button>
        </div>
        
        <button className="flex items-center gap-3 p-1 rounded-full hover:bg-[var(--color-bg-secondary)] transition-colors group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[var(--color-text-primary)] leading-none">John Doe</p>
            <p className="text-[10px] text-[var(--color-text-secondary)] font-medium mt-1">Product Designer</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[var(--color-bg-blue-button)] flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-white group-hover:scale-105 transition-transform">
            JD
          </div>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
