import React from 'react';
import { Search, CalendarRange, RotateCcw } from 'lucide-react';

interface TaskFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedPriority: string;
  setSelectedPriority: (p: string) => void;
  selectedStatus: string;
  setSelectedStatus: (s: string) => void;
  selectedTag: string;
  setSelectedTag: (t: string) => void;
  allTags: string[];
  dueDateFrom: string;
  setDueDateFrom: (d: string) => void;
  dueDateTo: string;
  setDueDateTo: (d: string) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedPriority,
  setSelectedPriority,
  selectedStatus,
  setSelectedStatus,
  selectedTag,
  setSelectedTag,
  allTags,
  dueDateFrom,
  setDueDateFrom,
  dueDateTo,
  setDueDateTo,
}) => {
  const isFiltered =
    !!searchQuery ||
    !!selectedPriority ||
    !!selectedStatus ||
    !!selectedTag ||
    !!dueDateFrom ||
    !!dueDateTo;

  const handleReset = () => {
    setSearchQuery('');
    setSelectedPriority('');
    setSelectedStatus('');
    setSelectedTag('');
    setDueDateFrom('');
    setDueDateTo('');
  };

  return (
    <div
      className="task-filters"
      style={{
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
      }}
    >
      {/* Search Input */}
      <div
        className="task-filters-search"
        style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}
      >
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            opacity: 0.7,
          }}
        />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px 8px 36px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-main)',
            fontSize: '13px',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            transition: 'border-color var(--transition-fast)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
        />
      </div>

      {/* Filter Priority */}
      <div
        className="task-filters-field"
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-main)',
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Filter Status */}
      <div className="task-filters-field">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-main)',
            fontSize: '13px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Filter Tag */}
      {allTags.length > 0 && (
        <div className="task-filters-field">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">All Tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filter Due Date Range */}
      <div
        className="task-filters-date task-filters-field"
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <CalendarRange size={14} style={{ color: 'var(--text-muted)' }} />
        <div
          className="task-filters-date-range"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <input
            type="date"
            value={dueDateFrom}
            onChange={(e) => setDueDateFrom(e.target.value)}
            title="Due date from"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            –
          </span>
          <input
            type="date"
            value={dueDateTo}
            onChange={(e) => setDueDateTo(e.target.value)}
            title="Due date to"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          />
        </div>
      </div>

      {/* Reset Filters */}
      {isFiltered && (
        <button
          onClick={handleReset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-primary)',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          <RotateCcw size={13} />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};
