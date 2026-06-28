import React, { useState } from 'react';
import { Bell, Settings, Search, Sun, Moon, LogOut } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabaseStorageService } from '../../services/index.js';
import ProfileModal from '../profile/ProfileModal';

const Topbar = () => {
  const { activeWorkspace, activeView, activeBoard } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const avatarUrl = user?.avatarUrl
    ? supabaseStorageService.getAvatarUrl(user.avatarUrl)
    : null;

  return (
    <header className="h-16 border-b border-border bg-bg flex items-center justify-between px-8 z-10">
      <div className="flex items-center gap-4">
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
            onClick={() => setShowProfileModal(true)}
            className="p-2 text-text-secondary hover:bg-bg-tertiary rounded-full transition-colors"
            title="Profile settings"
          >
            <Settings size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block mr-2">
            <p className="text-sm font-bold text-text leading-none">{user?.fullName || user?.email || 'Guest'}</p>
            <p className="text-[10px] text-text-secondary font-medium mt-1">{user ? 'Active' : 'Not signed in'}</p>
          </div>
          <div
            onClick={() => setShowProfileModal(true)}
            className="w-9 h-9 rounded-full bg-button flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-white group-hover:scale-105 transition-transform cursor-pointer overflow-hidden shrink-0"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              (user?.fullName || user?.email || 'G').slice(0, 2).toUpperCase()
            )}
          </div>
          {user && (
            <button onClick={logout} className="p-2 ml-2 rounded-md hover:bg-bg-tertiary transition-colors" title="Sign out">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>

      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </header>
  );
};

export default Topbar;
