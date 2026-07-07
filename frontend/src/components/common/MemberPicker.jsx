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

  const allMembersSorted = [...members].sort((a, b) => {
    const aSelected = selectedUserIds.includes(a.userId);
    const bSelected = selectedUserIds.includes(b.userId);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });

  const filtered = search
    ? allMembersSorted.filter(m => {
        const name = (m.user?.fullName || '').toLowerCase();
        const email = (m.user?.email || '').toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q) || email.includes(q);
      })
    : allMembersSorted;

  return (
    <>
      {/* Selected members chips + dropdown trigger inline */}
      <div className="flex gap-2 flex-wrap items-center">
        {selectedMembers.map(m => {
          const avatarUrl = m.user?.avatarUrl ? supabaseStorageService.getAvatarUrl(m.user.avatarUrl) : null;
          return (
            <div key={m.userId}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <span className="w-8 h-8 inline-flex items-center justify-center text-xs font-bold text-text-secondary shrink-0">
                  {getInitials(m.user?.fullName)}
                </span>
              )}
            </div>
          );
        })}

        {/* Dropdown trigger */}
        {!disabled && (
          <div ref={containerRef}>
            <button
              ref={triggerRef}
              type="button"
              onClick={handleOpen}
              disabled={disabled}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-dashed border-border text-text-secondary hover:text-text hover:border-text-secondary transition-colors"
            >
              {isLoading ? (
                <Loader size={12} className="animate-spin" />
              ) : (
                '+ Add assignee'
              )}
            </button>

            {isOpen && triggerRef.current && createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[100] bg-bg border border-border rounded-xl shadow-xl p-2 space-y-1"
              style={{
                top: triggerRef.current.getBoundingClientRect().bottom + 6,
                left: triggerRef.current.getBoundingClientRect().left,
                minWidth: Math.max(240, triggerRef.current.offsetWidth),
              }}
            >
              <div className="p-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm outline-none focus:border-input-border-focus transition-colors"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-text-secondary text-center">
                    {search ? 'No members found' : 'No members available'}
                  </p>
                ) : (
                  filtered.map(m => {
                    const isSelected = selectedUserIds.includes(m.userId);
                    const avatarUrl = m.user?.avatarUrl ? supabaseStorageService.getAvatarUrl(m.user.avatarUrl) : null;
                    return (
                      <button
                        key={m.userId}
                        type="button"
                        onClick={() => {
                          toggleMember(m.userId);
                          setSearch('');
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-bg-tertiary transition-colors text-left group"
                      >
                        <div className="w-6 h-6 rounded-full bg-button text-white text-[9px] font-bold flex items-center justify-center shrink-0 overflow-hidden">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(m.user?.fullName)
                          )}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-sm text-text truncate">
                            {m.user?.fullName || 'Unknown'}
                          </p>
                          {m.user?.email && (
                            <p className="text-xs text-text-secondary truncate">
                              {m.user.email}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <X size={14} className="text-text-secondary hover:text-red-500 transition-colors" />
                        )}
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
      </div>
    </>
  );
};

export default MemberPicker;
