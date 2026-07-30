import { useState, useRef, useEffect } from 'react';
import { Search, X, Check, ChevronDown, Tag, User, Calendar, CheckCircle2 } from 'lucide-react';

const BoardFilterBar = ({
  filterState,
  setFilterState,
  boardLabels = [],
  availableAssignees = [],
  activeFilterCount,
  onClearFilters
}) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showDueDateDropdown, setShowDueDateDropdown] = useState(false);

  const statusDropdownRef = useRef(null);
  const labelDropdownRef = useRef(null);
  const assigneeDropdownRef = useRef(null);
  const dueDateDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setShowStatusDropdown(false);
      }
      if (labelDropdownRef.current && !labelDropdownRef.current.contains(e.target)) {
        setShowLabelDropdown(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target)) {
        setShowAssigneeDropdown(false);
      }
      if (dueDateDropdownRef.current && !dueDateDropdownRef.current.contains(e.target)) {
        setShowDueDateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeOtherDropdowns = (except) => {
    if (except !== 'status') setShowStatusDropdown(false);
    if (except !== 'label') setShowLabelDropdown(false);
    if (except !== 'assignee') setShowAssigneeDropdown(false);
    if (except !== 'dueDate') setShowDueDateDropdown(false);
  };

  const handleSearchChange = (e) => {
    setFilterState((prev) => ({ ...prev, search: e.target.value }));
  };

  const setStatus = (status) => {
    setFilterState((prev) => ({ ...prev, status }));
    setShowStatusDropdown(false);
  };

  const toggleLabel = (labelId) => {
    setFilterState((prev) => {
      const exists = prev.labels.includes(labelId);
      const nextLabels = exists
        ? prev.labels.filter((id) => id !== labelId)
        : [...prev.labels, labelId];
      return { ...prev, labels: nextLabels };
    });
  };

  const toggleAssignee = (val) => {
    setFilterState((prev) => {
      const exists = prev.assignees.includes(val);
      const nextAssignees = exists
        ? prev.assignees.filter((id) => id !== val)
        : [...prev.assignees, val];
      return { ...prev, assignees: nextAssignees };
    });
  };

  const setDueDate = (dueDate) => {
    setFilterState((prev) => ({ ...prev, dueDate }));
    setShowDueDateDropdown(false);
  };

  const selectedLabelsCount = filterState.labels.length;
  const selectedAssigneesCount = filterState.assignees.length;

  const getStatusLabel = () => {
    if (filterState.status === 'incomplete') return 'Status (Incomplete)';
    if (filterState.status === 'completed') return 'Status (Completed)';
    return 'Status';
  };

  const getDueDateLabel = () => {
    if (filterState.dueDate === 'overdue') return 'Due Date (Overdue)';
    if (filterState.dueDate === 'today') return 'Due Date (Today)';
    if (filterState.dueDate === 'week') return 'Due Date (This Week)';
    if (filterState.dueDate === 'has-date') return 'Due Date (Has Date)';
    if (filterState.dueDate === 'no-date') return 'Due Date (No Date)';
    return 'Due Date';
  };

  return (
    <div className="bg-bg border-b border-border px-3 py-2.5 sm:px-6 flex items-center justify-between gap-2.5 flex-wrap transition-all flex-shrink-0 shadow-sm text-xs">
      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
        {/* Search Input */}
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input
            type="text"
            value={filterState.search}
            onChange={handleSearchChange}
            placeholder="Search tasks..."
            className="w-full pl-8 pr-7 py-1.5 bg-bg-secondary text-text border border-border rounded-lg placeholder:text-text-secondary focus:outline-none focus:border-input-border-focus transition-colors"
          />
          {filterState.search && (
            <button
              onClick={() => setFilterState((prev) => ({ ...prev, search: '' }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text p-0.5 rounded transition-colors"
              title="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative" ref={statusDropdownRef}>
          <button
            type="button"
            onClick={() => {
              closeOtherDropdowns('status');
              setShowStatusDropdown((prev) => !prev);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              filterState.status !== 'all'
                ? 'bg-button/10 text-button border-button font-medium'
                : 'bg-bg-secondary text-text border-border hover:border-text-secondary'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>{getStatusLabel()}</span>
            <ChevronDown size={13} className={`transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showStatusDropdown && (
            <div className="absolute left-0 mt-1 w-48 bg-bg border border-border rounded-lg shadow-lg z-30 p-2 flex flex-col gap-1">
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider px-2 py-1 border-b border-border">
                Filter by Status
              </div>
              <button
                onClick={() => setStatus('all')}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-bg-tertiary transition-colors text-left text-xs ${
                  filterState.status === 'all' ? 'bg-bg-tertiary font-medium' : ''
                }`}
              >
                <span className="text-text">All Statuses</span>
                {filterState.status === 'all' && <Check size={14} className="text-button shrink-0" />}
              </button>
              <button
                onClick={() => setStatus('incomplete')}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-bg-tertiary transition-colors text-left text-xs ${
                  filterState.status === 'incomplete' ? 'bg-bg-tertiary font-medium' : ''
                }`}
              >
                <span className="text-text">Incomplete</span>
                {filterState.status === 'incomplete' && <Check size={14} className="text-button shrink-0" />}
              </button>
              <button
                onClick={() => setStatus('completed')}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-bg-tertiary transition-colors text-left text-xs ${
                  filterState.status === 'completed' ? 'bg-bg-tertiary font-medium' : ''
                }`}
              >
                <span className="text-text">Completed</span>
                {filterState.status === 'completed' && <Check size={14} className="text-button shrink-0" />}
              </button>
            </div>
          )}
        </div>

        {/* Labels Dropdown */}
        {boardLabels.length > 0 && (
          <div className="relative" ref={labelDropdownRef}>
            <button
              type="button"
              onClick={() => {
                closeOtherDropdowns('label');
                setShowLabelDropdown((prev) => !prev);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                selectedLabelsCount > 0
                  ? 'bg-button/10 text-button border-button font-medium'
                  : 'bg-bg-secondary text-text border-border hover:border-text-secondary'
              }`}
            >
              <Tag size={13} />
              <span>
                {selectedLabelsCount > 0 ? `Labels (${selectedLabelsCount})` : 'Labels'}
              </span>
              <ChevronDown size={13} className={`transition-transform ${showLabelDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showLabelDropdown && (
              <div className="absolute left-0 mt-1 w-52 bg-bg border border-border rounded-lg shadow-lg z-30 p-2 flex flex-col gap-1 max-h-60 overflow-y-auto">
                <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider px-2 py-1 border-b border-border">
                  Filter by Label
                </div>
                {boardLabels.map((label) => {
                  const isSelected = filterState.labels.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => toggleLabel(label.id)}
                      className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-bg-tertiary transition-colors text-left text-xs ${
                        isSelected ? 'bg-bg-tertiary font-medium' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="truncate text-text">{label.name}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-button shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Assignee Dropdown */}
        <div className="relative" ref={assigneeDropdownRef}>
          <button
            type="button"
            onClick={() => {
              closeOtherDropdowns('assignee');
              setShowAssigneeDropdown((prev) => !prev);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              selectedAssigneesCount > 0
                ? 'bg-button/10 text-button border-button font-medium'
                : 'bg-bg-secondary text-text border-border hover:border-text-secondary'
            }`}
          >
            <User size={13} />
            <span>
              {selectedAssigneesCount > 0 ? `Assignee (${selectedAssigneesCount})` : 'Assignee'}
            </span>
            <ChevronDown size={13} className={`transition-transform ${showAssigneeDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showAssigneeDropdown && (
            <div className="absolute left-0 mt-1 w-56 bg-bg border border-border rounded-lg shadow-lg z-30 p-2 flex flex-col gap-1 max-h-64 overflow-y-auto">
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider px-2 py-1 border-b border-border">
                Filter by Assignee
              </div>
              
              <button
                onClick={() => toggleAssignee('me')}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-bg-tertiary transition-colors text-left text-xs ${
                  filterState.assignees.includes('me') ? 'bg-bg-tertiary font-medium' : ''
                }`}
              >
                <span className="text-text">Assigned to me</span>
                {filterState.assignees.includes('me') && <Check size={14} className="text-button shrink-0" />}
              </button>

              <button
                onClick={() => toggleAssignee('unassigned')}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-bg-tertiary transition-colors text-left text-xs ${
                  filterState.assignees.includes('unassigned') ? 'bg-bg-tertiary font-medium' : ''
                }`}
              >
                <span className="text-text">Unassigned</span>
                {filterState.assignees.includes('unassigned') && <Check size={14} className="text-button shrink-0" />}
              </button>

              {availableAssignees.length > 0 && (
                <div className="my-1 border-t border-border" />
              )}

              {availableAssignees.map((assignee) => {
                const isSelected = filterState.assignees.includes(assignee.id);
                return (
                  <button
                    key={assignee.id}
                    onClick={() => toggleAssignee(assignee.id)}
                    className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-bg-tertiary transition-colors text-left text-xs ${
                      isSelected ? 'bg-bg-tertiary font-medium' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {assignee.avatarUrl ? (
                        <img
                          src={assignee.avatarUrl}
                          alt={assignee.fullName}
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-button/20 text-button flex items-center justify-center text-[9px] font-bold shrink-0">
                          {assignee.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                      <span className="truncate text-text">{assignee.fullName}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-button shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Due Date Dropdown */}
        <div className="relative" ref={dueDateDropdownRef}>
          <button
            type="button"
            onClick={() => {
              closeOtherDropdowns('dueDate');
              setShowDueDateDropdown((prev) => !prev);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              filterState.dueDate !== 'all'
                ? 'bg-button/10 text-button border-button font-medium'
                : 'bg-bg-secondary text-text border-border hover:border-text-secondary'
            }`}
          >
            <Calendar size={13} />
            <span>{getDueDateLabel()}</span>
            <ChevronDown size={13} className={`transition-transform ${showDueDateDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDueDateDropdown && (
            <div className="absolute left-0 mt-1 w-52 bg-bg border border-border rounded-lg shadow-lg z-30 p-2 flex flex-col gap-1">
              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider px-2 py-1 border-b border-border">
                Filter by Due Date
              </div>
              <button
                onClick={() => setDueDate('all')}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-bg-tertiary transition-colors text-left text-xs ${
                  filterState.dueDate === 'all' ? 'bg-bg-tertiary font-medium' : ''
                }`}
              >
                <span className="text-text">Any Due Date</span>
                {filterState.dueDate === 'all' && <Check size={14} className="text-button shrink-0" />}
              </button>
              <button
                onClick={() => setDueDate('overdue')}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-bg-tertiary transition-colors text-left text-xs ${
                  filterState.dueDate === 'overdue' ? 'bg-bg-tertiary font-medium' : ''
                }`}
              >
                <span className="text-text">Overdue</span>
                {filterState.dueDate === 'overdue' && <Check size={14} className="text-button shrink-0" />}
              </button>
              <button
                onClick={() => setDueDate('today')}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-bg-tertiary transition-colors text-left text-xs ${
                  filterState.dueDate === 'today' ? 'bg-bg-tertiary font-medium' : ''
                }`}
              >
                <span className="text-text">Due Today</span>
                {filterState.dueDate === 'today' && <Check size={14} className="text-button shrink-0" />}
              </button>
              <button
                onClick={() => setDueDate('week')}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-bg-tertiary transition-colors text-left text-xs ${
                  filterState.dueDate === 'week' ? 'bg-bg-tertiary font-medium' : ''
                }`}
              >
                <span className="text-text">Due This Week</span>
                {filterState.dueDate === 'week' && <Check size={14} className="text-button shrink-0" />}
              </button>
              <button
                onClick={() => setDueDate('has-date')}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-bg-tertiary transition-colors text-left text-xs ${
                  filterState.dueDate === 'has-date' ? 'bg-bg-tertiary font-medium' : ''
                }`}
              >
                <span className="text-text">Has Due Date</span>
                {filterState.dueDate === 'has-date' && <Check size={14} className="text-button shrink-0" />}
              </button>
              <button
                onClick={() => setDueDate('no-date')}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-bg-tertiary transition-colors text-left text-xs ${
                  filterState.dueDate === 'no-date' ? 'bg-bg-tertiary font-medium' : ''
                }`}
              >
                <span className="text-text">No Due Date</span>
                {filterState.dueDate === 'no-date' && <Check size={14} className="text-button shrink-0" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Clear All button */}
      {activeFilterCount > 0 && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 text-xs text-button hover:text-button-hover font-medium px-2.5 py-1.5 rounded-lg bg-button/5 border border-button/20 hover:bg-button/10 transition-colors shrink-0"
        >
          <X size={13} />
          <span>Clear ({activeFilterCount})</span>
        </button>
      )}
    </div>
  );
};

export default BoardFilterBar;
