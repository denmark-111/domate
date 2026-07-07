import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { memberService, supabaseStorageService } from '../../services/index.js';
import { X, Loader } from 'lucide-react';

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const MemberPicker = ({ workspaceId, selectedUserIds = [], selectedUsers = [], onChange, disabled }) => {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hasFetched, setHasFetched] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const fetchMembers = useCallback(async () => {
    if (!workspaceId || hasFetched) return;
    setIsLoading(true);
    const res = await memberService.getWorkspaceMembers(workspaceId);
    if (res.success) {
      setMembers(res.data);
    }
    setHasFetched(true);
    setIsLoading(false);
  }, [workspaceId, hasFetched]);

  const handleOpen = () => {
    if (!isOpen) {
      fetchMembers();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    const id = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Reset fetch state when workspace changes
  useEffect(() => {
    setHasFetched(false);
    setMembers([]);
  }, [workspaceId]);

  const toggleMember = useCallback((userId) => {
    const updated = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    onChange?.(updated);
    setIsOpen(false);
    setSearch('');
  }, [selectedUserIds, onChange]);

  const selectedMembers = selectedUsers.map(u => ({ userId: u.id, user: u }));
  const nonSelectedMembers = members.filter(m => !selectedUserIds.includes(m.userId));

  const filtered = search
    ? nonSelectedMembers.filter(m => {
        const name = (m.user?.fullName || '').toLowerCase();
        const email = (m.user?.email || '').toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q) || email.includes(q);
      })
    : nonSelectedMembers;

  return (
    <>
      {/* Selected members chips — outside containerRef so clicking them closes the dropdown */}
      <div className="flex gap-1.5 flex-wrap mb-2">
        {selectedMembers.map(m => {
          const avatarUrl = m.user?.avatarUrl ? supabaseStorageService.getAvatarUrl(m.user.avatarUrl) : null;
          return (
            <div
              key={m.userId}
              className="flex items-center gap-1.5 bg-bg-tertiary px-2.5 py-1.5 rounded border border-border text-sm"
            >
              <div className="w-5 h-5 rounded-full bg-button text-white text-[8px] font-bold flex items-center justify-center shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(m.user?.fullName)
                )}
              </div>
              <span className="text-text-secondary text-xs max-w-[100px] truncate">
                {m.user?.fullName || m.user?.email || 'Unknown'}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => toggleMember(m.userId)}
                  className="p-0.5 text-text-secondary hover:text-red-500 rounded transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Dropdown trigger */}
      {!disabled && (
        <div ref={containerRef}>
          <button
            ref={triggerRef}
            type="button"
            onClick={handleOpen}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-border bg-bg cursor-pointer hover:border-accent/50 transition-colors text-sm text-text-secondary w-full disabled:opacity-50"
          >
            {isLoading ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <span>+ Add assignee</span>
            )}
          </button>

          {isOpen && triggerRef.current && createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[100] bg-bg-secondary border border-border rounded-lg shadow-xl"
              style={{
                top: triggerRef.current.getBoundingClientRect().bottom + 4,
                left: triggerRef.current.getBoundingClientRect().left,
                minWidth: Math.max(220, triggerRef.current.offsetWidth),
              }}
            >
              <div className="p-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members..."
                  className="w-full px-3 py-2 rounded-md border border-border bg-bg text-text text-sm outline-none focus:border-input-border-focus transition-colors"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-text-secondary text-center">
                    {search ? 'No members found' : 'All members assigned'}
                  </p>
                ) : (
                  filtered.map(m => {
                    const avatarUrl = m.user?.avatarUrl ? supabaseStorageService.getAvatarUrl(m.user.avatarUrl) : null;
                    return (
                      <button
                        key={m.userId}
                        type="button"
                        onClick={() => {
                          toggleMember(m.userId);
                          setSearch('');
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-bg-tertiary transition-colors text-left"
                      >
                        <div className="w-6 h-6 rounded-full bg-button text-white text-[9px] font-bold flex items-center justify-center shrink-0 overflow-hidden">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(m.user?.fullName)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-text truncate">
                            {m.user?.fullName || 'Unknown'}
                          </p>
                          {m.user?.email && (
                            <p className="text-xs text-text-secondary truncate">
                              {m.user.email}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body
          )}
        </div>
      )}
    </>
  );
};

export default MemberPicker;
