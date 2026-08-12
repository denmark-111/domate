import { useState, useRef, useEffect } from 'react';
import { Settings, Search, Sun, Moon, LogOut, User, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabaseStorageService, searchService } from '../../services/index.js';
import NotificationBell from '../notifications/NotificationBell';

const Topbar = ({ onToggle, hideBranding = false, hideSearch = false, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
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

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length < 2) {
      setSearchResults({ workspaces: [], boards: [] });
      setShowSearchDropdown(false);
    }
  };

  useEffect(() => {
    if (hideSearch || searchQuery.length < 2) return;

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
  }, [searchQuery, hideSearch]);

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
    <header className="h-14 sm:h-16 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between px-4 sm:px-6 z-10">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 h-full">
        {onToggle && (
          <button
            onClick={onToggle}
            className="lg:hidden -ml-2 p-2 text-secondary hover:bg-surface-container-low rounded-DEFAULT transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        )}

        {title && (
          <span className="font-headline-md text-base sm:text-lg font-bold text-on-surface tracking-tight truncate select-none">
            {title}
          </span>
        )}

          {!hideBranding && (
            <>
              <span
                onClick={() => navigate('/dashboard')}
                className="font-headline-md text-xl sm:text-2xl font-bold text-on-surface cursor-pointer tracking-tight shrink-0 mr-4 select-none"
              >
                Domate
              </span>

              {/* Top Navbar Links (Home link removed, clicking Domate navigates to home) */}
              <nav className="hidden md:flex items-center h-full gap-1 font-body-sm text-sm font-medium">
                <button
                  onClick={() => navigate('/tasks')}
                  className={`h-full px-4 flex items-center transition-colors relative cursor-pointer ${
                    location.pathname === '/tasks'
                      ? 'text-on-surface font-bold'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  <span>Tasks</span>
                  {location.pathname === '/tasks' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                  )}
                </button>
                <button
                  onClick={() => navigate('/workspaces')}
                  className={`h-full px-4 flex items-center transition-colors relative cursor-pointer ${
                    location.pathname === '/workspaces'
                      ? 'text-on-surface font-bold'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  <span>Workspaces</span>
                  {location.pathname === '/workspaces' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                  )}
                </button>
              </nav>
            </>
          )}

          {/* Desktop search */}
          {!hideSearch && (
            <div className="relative group hidden md:block" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search boards, workspaces..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
                className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-DEFAULT text-sm focus:outline-none focus:bg-surface-container-lowest focus:border-primary transition-all w-64 lg:w-80 xl:w-96"
              />

              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-xl z-50 max-h-80 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-sm text-secondary text-center">Searching...</div>
                  ) : searchResults.workspaces.length === 0 && searchResults.boards.length === 0 ? (
                    <div className="p-4 text-sm text-secondary text-center">No results found</div>
                  ) : (
                    <>
                      {searchResults.workspaces.length > 0 && (
                        <div>
                          <div className="px-4 pt-3 pb-1 text-xs font-mono-label font-bold text-secondary uppercase tracking-wider">Workspaces</div>
                          {searchResults.workspaces.map((ws) => (
                            <button
                              key={ws.id}
                              onClick={() => { navigate(`/workspaces/${ws.id}`); setShowSearchDropdown(false); setSearchQuery(''); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
                            >
                              {ws.coverImageUrl ? (
                                <img src={supabaseStorageService.getCoverImageUrl(ws.coverImageUrl)} alt="" className="w-8 h-8 rounded-DEFAULT object-cover shrink-0" />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-DEFAULT flex items-center justify-center text-on-primary text-xs font-bold shadow-sm shrink-0"
                                  style={{ backgroundColor: ws.color || 'var(--color-primary)' }}
                                >
                                  {ws.name[0]}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold truncate">{ws.name}</p>
                                <p className="text-xs text-secondary">Workspace</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.boards.length > 0 && (
                        <div>
                          <div className="px-4 pt-3 pb-1 text-xs font-mono-label font-bold text-secondary uppercase tracking-wider">Boards</div>
                          {searchResults.boards.map((board) => (
                            <button
                              key={board.id}
                              onClick={() => { navigate(`/workspaces/${board.workspace.id}/boards/${board.id}`); setShowSearchDropdown(false); setSearchQuery(''); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
                            >
                              <div
                                className="w-8 h-8 rounded-DEFAULT flex items-center justify-center text-xs text-on-primary shrink-0"
                                style={{ backgroundColor: board.color || 'var(--color-surface-container-high)' }}
                              >
                                {board.name[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold truncate">{board.name}</p>
                                <p className="text-xs text-secondary truncate">{board.workspace?.name}</p>
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
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search toggle */}
          {!hideSearch && (
            <button
              onClick={() => setShowMobileSearch(true)}
              className="md:hidden p-2 text-secondary hover:bg-surface-container-low rounded-DEFAULT transition-colors"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 text-secondary hover:bg-surface-container-low rounded-full transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <div className="flex items-center gap-1 sm:gap-2">
            <NotificationBell />
            <button
              onClick={() => navigate('/settings')}
              className="hidden sm:block p-2 text-secondary hover:bg-surface-container-low rounded-full transition-colors"
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center cursor-pointer group relative"
            >
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold overflow-hidden shrink-0"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (user?.fullName || user?.email || 'G').split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2)
                )}
              </div>

              {!dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 px-2.5 py-1 bg-inverse-surface text-inverse-on-surface text-xs font-body-sm font-medium rounded-DEFAULT shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-40">
                  {user?.fullName || user?.email || 'User'}
                </div>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-xl z-50 py-1">
                <button
                  onClick={() => { navigate('/settings'); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
                >
                  <User size={16} className="text-secondary" />
                  Profile
                </button>
                <div className="border-t border-outline-variant mx-2" />
                <button
                  onClick={() => { logout(); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left"
                >
                  <LogOut size={16} className="text-secondary" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

      {/* Mobile search overlay */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-50 bg-background md:hidden flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b border-outline-variant">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder="Search boards, workspaces..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-DEFAULT text-sm focus:outline-none focus:bg-surface-container-lowest focus:border-primary transition-all"
              />
            </div>
            <button
              onClick={() => { setShowMobileSearch(false); setSearchQuery(''); setShowSearchDropdown(false); }}
              className="px-3 py-2 text-sm text-secondary hover:text-on-surface font-semibold"
            >
              Cancel
            </button>
          </div>
          {showSearchDropdown && (
            <div className="flex-1 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-sm text-secondary text-center">Searching...</div>
              ) : searchResults.workspaces.length === 0 && searchResults.boards.length === 0 ? (
                <div className="p-4 text-sm text-secondary text-center">No results found</div>
              ) : (
                <>
                  {searchResults.workspaces.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1 text-xs font-mono-label font-bold text-secondary uppercase tracking-wider">Workspaces</div>
                      {searchResults.workspaces.map((ws) => (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => { navigate(`/workspaces/${ws.id}`); setShowMobileSearch(false); setShowSearchDropdown(false); setSearchQuery(''); }}
                          onTouchEnd={(e) => { e.preventDefault(); navigate(`/workspaces/${ws.id}`); setShowMobileSearch(false); setShowSearchDropdown(false); setSearchQuery(''); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left border-b border-outline-variant"
                        >
                          {ws.coverImageUrl ? (
                            <img src={supabaseStorageService.getCoverImageUrl(ws.coverImageUrl)} alt="" className="w-8 h-8 rounded-DEFAULT object-cover shrink-0" />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-DEFAULT flex items-center justify-center text-on-primary text-xs font-bold shadow-sm shrink-0"
                              style={{ backgroundColor: ws.color || 'var(--color-primary)' }}
                            >
                              {ws.name[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold truncate">{ws.name}</p>
                            <p className="text-xs text-secondary">Workspace</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.boards.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1 text-xs font-mono-label font-bold text-secondary uppercase tracking-wider">Boards</div>
                      {searchResults.boards.map((board) => (
                        <button
                          key={board.id}
                          type="button"
                          onClick={() => { navigate(`/workspaces/${board.workspace.id}/boards/${board.id}`); setShowMobileSearch(false); setShowSearchDropdown(false); setSearchQuery(''); }}
                          onTouchEnd={(e) => { e.preventDefault(); navigate(`/workspaces/${board.workspace.id}/boards/${board.id}`); setShowMobileSearch(false); setShowSearchDropdown(false); setSearchQuery(''); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low transition-colors text-left border-b border-outline-variant"
                        >
                          <div
                            className="w-8 h-8 rounded-DEFAULT flex items-center justify-center text-xs text-on-primary shrink-0"
                            style={{ backgroundColor: board.color || 'var(--color-surface-container-high)' }}
                          >
                            {board.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold truncate">{board.name}</p>
                            <p className="text-xs text-secondary truncate">{board.workspace?.name}</p>
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