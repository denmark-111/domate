import React, { useState, useRef, useEffect } from 'react';
import { Settings, Search, Sun, Moon, LogOut, User, ChevronDown, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabaseStorageService, searchService } from '../../services/index.js';
import NotificationBell from '../notifications/NotificationBell';
import AppLogo from '../common/AppLogo';

const Topbar = ({ collapsed, mobileSidebarOpen, onToggle, hideSidebarToggle = false }) => {
  const navigate = useNavigate();
  const { activeWorkspace, activeView, activeBoard } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ workspaces: [], boards: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (!showMobileSearch && searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileSearch]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults({ workspaces: [], boards: [] });
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowSearchDropdown(true);
      const res = await searchService.searchMyStuff(searchQuery);
      if (res.success) {
        setSearchResults(res.data);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowSearchDropdown(false);
        setSearchQuery('');
        setShowMobileSearch(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Focus mobile search input when opened
  useEffect(() => {
    if (showMobileSearch && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [showMobileSearch]);

  const avatarUrl = user?.avatarUrl
    ? supabaseStorageService.getAvatarUrl(user.avatarUrl)
    : null;

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-bg flex items-center justify-between px-3 sm:px-4 z-10">
      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
        {!hideSidebarToggle && (
          <>
            {/* Mobile hamburger */}
            <button
              onClick={onToggle}
              className="lg:hidden p-2 text-text-secondary hover:bg-bg-tertiary rounded-lg transition-colors"
              aria-label={mobileSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Desktop sidebar toggle */}
            <button
              onClick={onToggle}
              className="hidden lg:block p-2 text-text-secondary hover:bg-bg-tertiary rounded-lg transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
          </>
        )}

        <button
          onClick={() => navigate('/dashboard')}
          className="group shrink-0"
        >
          <AppLogo size="xs" className="group-hover:scale-105 transition-transform" />
        </button>

        {/* Desktop search */}
        <div className="relative group hidden md:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-text-accent transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search boards, workspaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
            className="pl-10 pr-4 py-2 bg-bg-secondary border border-transparent rounded-lg text-sm focus:outline-none focus:bg-bg focus:border-input-border-focus transition-all w-48 lg:w-64"
          />

          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-bg border border-border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-sm text-text-secondary text-center">Searching...</div>
              ) : searchResults.workspaces.length === 0 && searchResults.boards.length === 0 ? (
                <div className="p-4 text-sm text-text-secondary text-center">No results found</div>
              ) : (
                <>
                  {searchResults.workspaces.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1 text-xs font-bold text-text-secondary uppercase tracking-wider">Workspaces</div>
                      {searchResults.workspaces.map((ws) => (
                        <button
                          key={ws.id}
                          onClick={() => { navigate(`/workspaces/${ws.id}`); setShowSearchDropdown(false); setSearchQuery(''); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-bg-tertiary transition-colors text-left"
                        >
                          {ws.coverImageUrl ? (
                            <img src={supabaseStorageService.getCoverImageUrl(ws.coverImageUrl)} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0"
                              style={{ backgroundColor: ws.color || 'var(--color-button)' }}
                            >
                              {ws.name[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold truncate">{ws.name}</p>
                            <p className="text-xs text-text-secondary">Workspace</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.boards.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1 text-xs font-bold text-text-secondary uppercase tracking-wider">Boards</div>
                      {searchResults.boards.map((board) => (
                        <button
                          key={board.id}
                          onClick={() => { navigate(`/workspaces/${board.workspace.id}`, { state: { selectBoardId: board.id } }); setShowSearchDropdown(false); setSearchQuery(''); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-bg-tertiary transition-colors text-left"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white shrink-0"
                            style={{ backgroundColor: board.color || 'var(--color-bg-tertiary)' }}
                          >
                            {board.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold truncate">{board.name}</p>
                            <p className="text-xs text-text-secondary truncate">{board.workspace?.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile search toggle */}
        <button
          onClick={() => setShowMobileSearch(true)}
          className="md:hidden p-2 text-text-secondary hover:bg-bg-tertiary rounded-lg transition-colors"
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-text-secondary hover:bg-bg-tertiary rounded-full transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className="flex items-center gap-1 sm:gap-2 pr-3 sm:pr-6 border-r border-border-light">
          <NotificationBell />
          <button
            onClick={() => navigate('/settings')}
            className="hidden sm:block p-2 text-text-secondary hover:bg-bg-tertiary rounded-full transition-colors"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 relative" ref={dropdownRef}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-text leading-none">{user?.fullName || user?.email || 'Guest'}</p>
          </div>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1 cursor-pointer"
          >
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-button flex items-center justify-center text-white text-xs font-bold border-2 border-white overflow-hidden shrink-0"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (user?.fullName || user?.email || 'G').split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
              )}
            </div>
            <ChevronDown
              size={14}
              className={`hidden sm:block text-text-secondary transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-bg border border-border rounded-lg shadow-xl z-50 py-1">
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

      {/* Mobile search overlay */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-50 bg-bg md:hidden flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b border-border">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder="Search boards, workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:bg-bg focus:border-input-border-focus transition-all"
              />
            </div>
            <button
              onClick={() => { setShowMobileSearch(false); setSearchQuery(''); setShowSearchDropdown(false); }}
              className="px-3 py-2 text-sm text-text-secondary hover:text-text font-semibold"
            >
              Cancel
            </button>
          </div>
          {showSearchDropdown && (
            <div className="flex-1 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-sm text-text-secondary text-center">Searching...</div>
              ) : searchResults.workspaces.length === 0 && searchResults.boards.length === 0 ? (
                <div className="p-4 text-sm text-text-secondary text-center">No results found</div>
              ) : (
                <>
                  {searchResults.workspaces.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1 text-xs font-bold text-text-secondary uppercase tracking-wider">Workspaces</div>
                      {searchResults.workspaces.map((ws) => (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => { navigate(`/workspaces/${ws.id}`); setShowMobileSearch(false); setShowSearchDropdown(false); setSearchQuery(''); }}
                          onTouchEnd={(e) => { e.preventDefault(); navigate(`/workspaces/${ws.id}`); setShowMobileSearch(false); setShowSearchDropdown(false); setSearchQuery(''); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text hover:bg-bg-tertiary transition-colors text-left border-b border-border-light"
                        >
                          {ws.coverImageUrl ? (
                            <img src={supabaseStorageService.getCoverImageUrl(ws.coverImageUrl)} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0"
                              style={{ backgroundColor: ws.color || 'var(--color-button)' }}
                            >
                              {ws.name[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold truncate">{ws.name}</p>
                            <p className="text-xs text-text-secondary">Workspace</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.boards.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1 text-xs font-bold text-text-secondary uppercase tracking-wider">Boards</div>
                      {searchResults.boards.map((board) => (
                        <button
                          key={board.id}
                          type="button"
                          onClick={() => { navigate(`/workspaces/${board.workspace.id}`, { state: { selectBoardId: board.id } }); setShowMobileSearch(false); setShowSearchDropdown(false); setSearchQuery(''); }}
                          onTouchEnd={(e) => { e.preventDefault(); navigate(`/workspaces/${board.workspace.id}`, { state: { selectBoardId: board.id } }); setShowMobileSearch(false); setShowSearchDropdown(false); setSearchQuery(''); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text hover:bg-bg-tertiary transition-colors text-left border-b border-border-light"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white shrink-0"
                            style={{ backgroundColor: board.color || 'var(--color-bg-tertiary)' }}
                          >
                            {board.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold truncate">{board.name}</p>
                            <p className="text-xs text-text-secondary truncate">{board.workspace?.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Topbar;