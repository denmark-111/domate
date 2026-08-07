import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaceService, supabaseStorageService } from '../../services/index.js';
import CreateWorkspaceForm from './CreateWorkspaceForm';
import WorkspaceIcon from './WorkspaceIcon';
import Button from '../common/Button';
import { Plus, LayoutGrid, List as ListIcon, ChevronDown, LayoutDashboard, Search, Loader } from 'lucide-react';

const WorkspacesList = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [workspacesPagination, setWorkspacesPagination] = useState(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [isFetchingMoreWorkspaces, setIsFetchingMoreWorkspaces] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('recent'); // 'recent' (default backend order) | 'name' | 'activity'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'team' | 'personal'
  const [searchQuery, setSearchQuery] = useState('');

  const scrollContainerRef = useRef(null);
  const sentinelRef = useRef(null);

  const fetchWorkspaces = useCallback(async (page = 1) => {
    if (page === 1) {
      setIsLoadingWorkspaces(true);
    } else {
      setIsFetchingMoreWorkspaces(true);
    }
    const res = await workspaceService.getWorkspaces({ page, limit: 10 });
    if (res.success && Array.isArray(res.data)) {
      setWorkspaces(prev => {
        const combined = page === 1 ? res.data : [...prev, ...res.data];
        const seen = new Set();
        return combined.filter(w => {
          if (seen.has(w.id)) return false;
          seen.add(w.id);
          return true;
        });
      });
      setWorkspacesPagination(res.pagination);
    } else if (page === 1) {
      setWorkspaces([]);
    }
    setIsLoadingWorkspaces(false);
    setIsFetchingMoreWorkspaces(false);
  }, []);

  useEffect(() => {
    fetchWorkspaces(1);
  }, [fetchWorkspaces]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;

    if (!workspacesPagination?.hasMore || isLoadingWorkspaces || isFetchingMoreWorkspaces) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchWorkspaces(workspacesPagination.page + 1);
        }
      },
      { root: container, rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [workspacesPagination, isLoadingWorkspaces, isFetchingMoreWorkspaces, fetchWorkspaces]);

  const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];

  // Filter & Sort workspaces
  const filteredWorkspaces = safeWorkspaces
    .filter((ws) => {
      if (filterType === 'team' && ws.type !== 'team') return false;
      if (filterType === 'personal' && ws.type === 'team') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = ws.name?.toLowerCase().includes(q);
        const matchesDesc = ws.description?.toLowerCase().includes(q);
        return matchesName || matchesDesc;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'recent') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'activity') {
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      }
      return 0;
    });

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-surface dark:bg-background">
      <main className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-10 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-on-surface tracking-tight">
              Your Workspaces
            </h1>
            <p className="font-body-md text-sm sm:text-base text-secondary mt-1">
              Dedicated collaboration hubs for your team's projects and boards.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="shrink-0 self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>New Workspace</span>
          </Button>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-surface-container-lowest border border-outline-variant p-3 sm:p-4 rounded-DEFAULT">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
              <input
                type="text"
                placeholder="Filter workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-sm text-body-sm text-on-surface focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {/* Sort Select */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-surface-container-lowest border border-outline-variant rounded-DEFAULT font-body-sm text-body-sm text-secondary py-1.5 pl-3 pr-8 focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="recent">Sort by: Newest First</option>
                <option value="name">Sort by: Name</option>
                <option value="activity">Sort by: Last Updated</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
            </div>

            <div className="h-4 w-px bg-outline-variant hidden sm:block"></div>

            {/* Type Filters */}
            <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant p-1 rounded-DEFAULT">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 text-xs font-label-caps rounded-DEFAULT transition-colors cursor-pointer ${
                  filterType === 'all' ? 'bg-surface-container-lowest text-primary font-bold' : 'text-secondary hover:text-on-surface'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('team')}
                className={`px-3 py-1 text-xs font-label-caps rounded-DEFAULT transition-colors cursor-pointer ${
                  filterType === 'team' ? 'bg-surface-container-lowest text-primary font-bold' : 'text-secondary hover:text-on-surface'
                }`}
              >
                Teams
              </button>
              <button
                onClick={() => setFilterType('personal')}
                className={`px-3 py-1 text-xs font-label-caps rounded-DEFAULT transition-colors cursor-pointer ${
                  filterType === 'personal' ? 'bg-surface-container-lowest text-primary font-bold' : 'text-secondary hover:text-on-surface'
                }`}
              >
                Personal
              </button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center self-end md:self-auto border border-outline-variant rounded-DEFAULT overflow-hidden bg-surface-container-lowest">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors flex items-center justify-center cursor-pointer ${
                viewMode === 'grid' ? 'bg-surface-container-high text-primary' : 'text-secondary hover:bg-surface-container-low'
              }`}
              title="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <div className="w-px h-full bg-outline-variant"></div>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors flex items-center justify-center cursor-pointer ${
                viewMode === 'list' ? 'bg-surface-container-high text-primary' : 'text-secondary hover:bg-surface-container-low'
              }`}
              title="List view"
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>

        {/* Loading Initial State */}
        {isLoadingWorkspaces && safeWorkspaces.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-surface-container rounded-DEFAULT border border-outline-variant" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoadingWorkspaces && filteredWorkspaces.length === 0 && (
          <div className="bg-surface-container-lowest border border-outline-variant border-dashed rounded-DEFAULT p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-surface-container-low border border-outline-variant flex items-center justify-center mb-4">
              <LayoutDashboard className="text-secondary" size={20} />
            </div>
            <h3 className="text-lg font-headline-md font-semibold text-on-surface mb-1">
              No workspaces found
            </h3>
            <p className="text-body-sm text-xs text-secondary max-w-sm mb-6">
              {searchQuery ? 'No workspaces match your search term.' : 'Get started by creating a new workspace.'}
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              <span>Create Workspace</span>
            </Button>
          </div>
        )}

        {/* Workspaces Display */}
        {filteredWorkspaces.length > 0 && (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkspaces.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => navigate(`/workspaces/${ws.id}`)}
                  className="group bg-surface-container-lowest border border-outline-variant hover:border-primary transition-all duration-200 flex flex-col h-[320px] cursor-pointer rounded-DEFAULT overflow-hidden"
                >
                  {/* Card Cover */}
                  <div className="h-36 w-full bg-surface-container-high relative overflow-hidden border-b border-outline-variant">
                    {ws.coverImageUrl ? (
                      <img
                        src={supabaseStorageService.getCoverImageUrl(ws.coverImageUrl)}
                        alt={ws.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center relative overflow-hidden"
                        style={{ backgroundColor: ws.color || 'var(--color-surface-container-high)' }}
                      >
                        <WorkspaceIcon
                          workspace={ws}
                          containerClassName="w-14 h-14 rounded-lg opacity-80"
                        />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="bg-surface-container-lowest border border-outline-variant text-on-surface px-2 py-0.5 rounded-DEFAULT text-[10px] font-label-caps tracking-widest uppercase font-bold">
                        {ws.type === 'team' ? 'TEAM' : 'PERSONAL'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h2 className="font-headline-md text-base font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                          {ws.name}
                        </h2>
                      </div>
                      <p className="font-body-sm text-xs text-secondary line-clamp-2 leading-snug">
                        {ws.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-outline-variant">
                      <div className="flex items-center gap-1.5 font-mono-label text-xs text-secondary">
                        <LayoutDashboard size={14} />
                        <span>{ws._count?.boards ?? 0} Board{(ws._count?.boards ?? 0) !== 1 ? 's' : ''}</span>
                      </div>

                      {/* Member Avatars Stack */}
                      <div className="flex items-center -space-x-2">
                        {(ws.members || []).slice(0, 3).map((member, i) => (
                          <div
                            key={member.id || i}
                            className="w-6 h-6 rounded-full border border-surface-container-lowest bg-primary text-on-primary flex items-center justify-center text-[9px] font-bold overflow-hidden"
                            title={member.fullName || 'Member'}
                          >
                            {member.avatarUrl ? (
                              <img src={supabaseStorageService.getAvatarUrl(member.avatarUrl)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              getInitials(member.fullName)
                            )}
                          </div>
                        ))}
                        {(ws._count?.memberships ?? 0) > 3 && (
                          <div className="w-6 h-6 rounded-full border border-surface-container-lowest bg-surface-container-high flex items-center justify-center font-label-caps text-[10px] font-bold text-on-surface">
                            +{ws._count.memberships - 3}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 font-body-sm text-[11px] text-tertiary-fixed-dim">
                      Created {formatTimeAgo(ws.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT divide-y divide-outline-variant overflow-hidden">
              {filteredWorkspaces.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => navigate(`/workspaces/${ws.id}`)}
                  className="flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <WorkspaceIcon
                      workspace={ws}
                      containerClassName="w-10 h-10 rounded-DEFAULT shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-body-md text-base font-bold text-on-surface group-hover:underline">
                          {ws.name}
                        </h4>
                        <span className="bg-surface-container-lowest border border-outline-variant px-2 py-0.5 rounded-DEFAULT text-[10px] font-label-caps uppercase text-on-surface font-bold">
                          {ws.type === 'team' ? 'TEAM' : 'PERSONAL'}
                        </span>
                      </div>
                      <p className="font-body-sm text-xs text-secondary truncate mt-0.5">
                        {ws.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-8 shrink-0 ml-4">
                    <span className="font-body-sm text-xs text-secondary">
                      {ws._count?.boards ?? 0} Board{(ws._count?.boards ?? 0) !== 1 ? 's' : ''}
                    </span>
                    <span className="font-body-sm text-xs text-secondary">
                      Created {formatTimeAgo(ws.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Infinite Scroll Sentinel */}
        <div ref={sentinelRef} className="h-4" />

        {/* Loading Indicator for subsequent pages */}
        {isFetchingMoreWorkspaces && safeWorkspaces.length > 0 && (
          <div className="space-y-6 pt-2 pb-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={`loading-skel-${i}`} className="h-[320px] bg-surface-container-low rounded-DEFAULT border border-outline-variant" />
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT divide-y divide-outline-variant overflow-hidden animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={`loading-skel-row-${i}`} className="h-16 bg-surface-container-low" />
                ))}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 py-2 text-secondary font-label-caps text-xs font-bold uppercase tracking-wider">
              <Loader size={16} className="animate-spin text-primary" />
              <span>Loading more workspaces...</span>
            </div>
          </div>
        )}
      </main>

      {showCreateModal && <CreateWorkspaceForm onClose={() => setShowCreateModal(false)} />}
    </div>
  );
};

export default WorkspacesList;
