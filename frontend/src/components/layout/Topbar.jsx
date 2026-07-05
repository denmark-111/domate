import React, { useState, useRef, useEffect } from 'react';
import { Bell, Settings, Search, Sun, Moon, LogOut, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabaseStorageService } from '../../services/index.js';

const Topbar = () => {
  const navigate = useNavigate();
  const { activeWorkspace, activeView, activeBoard } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarUrl = user?.avatarUrl
    ? supabaseStorageService.getAvatarUrl(user.avatarUrl)
    : null;

  return (
    <header className="h-16 border-b border-border bg-bg flex items-center justify-between px-4 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-button flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-105 transition-transform">
            B
          </div>
        </button>

        <div className="relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-text-accent transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search tasks, boards..." 
            className="pl-10 pr-4 py-2 bg-bg-secondary border border-transparent rounded-lg text-sm focus:outline-none focus:bg-bg focus:border-input-border-focus transition-all w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-text-secondary hover:bg-bg-tertiary rounded-full transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div className="flex items-center gap-2 pr-6 border-r border-border-light">
          <button className="p-2 text-text-secondary hover:bg-bg-tertiary rounded-full transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-error-text border-2 border-white rounded-full"></span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-text-secondary hover:bg-bg-tertiary rounded-full transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-text leading-none">{user?.fullName || user?.email || 'Guest'}</p>
          </div>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1 cursor-pointer"
          >
            <div
              className="w-9 h-9 rounded-full bg-button flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-white overflow-hidden shrink-0"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (user?.fullName || user?.email || 'G').slice(0, 2).toUpperCase()
              )}
            </div>
            <ChevronDown
              size={14}
              className={`text-text-secondary transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-bg border border-border rounded-xl shadow-xl z-50 py-1">
              <button
                onClick={() => { navigate('/settings'); setDropdownOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-bg-tertiary transition-colors text-left"
              >
                <User size={16} className="text-text-secondary" />
                Profile
              </button>
              <div className="border-t border-border mx-2" />
              <button
                onClick={() => { logout(); setDropdownOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-bg-tertiary transition-colors text-left"
              >
                <LogOut size={16} className="text-text-secondary" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
