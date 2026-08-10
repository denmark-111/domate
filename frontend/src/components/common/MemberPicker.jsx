import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { memberService, supabaseStorageService } from '../../services/index.js';
import { X, Loader } from 'lucide-react';
import { useDropdownPosition } from '../../hooks/useDropdownPosition.js';

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

  const dropdownStyle = useDropdownPosition(triggerRef, isOpen, { minWidth: 240, maxWidth: 320 });

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
                <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-outline-variant" />
              ) : (
                <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-mono-label text-xs font-bold shrink-0">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-label-caps text-xs font-bold uppercase text-secondary hover:text-on-surface bg-surface-container-lowest border border-dashed border-outline-variant hover:border-primary rounded-DEFAULT transition-all cursor-pointer disabled:opacity-50"
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
              className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-xl p-2 space-y-1.5 z-50"
              style={dropdownStyle}
            >
              <div className="p-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members..."
                  className="w-full px-3 py-1.5 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest text-on-surface font-body-sm text-xs outline-none focus:border-primary transition-colors"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-3 py-4 font-body-sm text-xs text-secondary text-center">
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
                        className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-DEFAULT hover:bg-surface-container-low transition-colors text-left group cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center shrink-0 overflow-hidden">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(m.user?.fullName)
                          )}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="font-body-sm text-xs text-on-surface truncate">
                            {m.user?.fullName || 'Unknown'}
                          </p>
                          {m.user?.email && (
                            <p className="font-body-sm text-[11px] text-secondary truncate">
                              {m.user.email}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <X size={14} className="text-secondary hover:text-error transition-colors shrink-0" />
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
