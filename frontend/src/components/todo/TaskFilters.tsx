import React from 'react';
import { Search, Filter, CalendarRange } from 'lucide-react';

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
  setDueDateTo
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '16px', 
      flexWrap: 'wrap', 
      alignItems: 'center' 
    }}>
      {/* Search Input */}
      <div style={{ position: 'relative', flexGrow: 1, minWidth: '240px' }}>
        <Search size={18} style={{ 
          position: 'absolute', 
          left: '14px', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          color: 'var(--text-muted)', 
          opacity: 0.7 
        }} />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 42px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-main)',
            fontSize: '15px',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            transition: 'border-color var(--transition-fast)'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
      </div>

      {/* Filter Priority */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Filter size={15} style={{ color: 'var(--text-muted)' }} />
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          style={{
            padding: '11px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-main)',
            fontSize: '15px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Filter Status */}
      <select
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
        style={{
          padding: '11px 16px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-app)',
          color: 'var(--text-main)',
          fontSize: '15px',
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        <option value="">All Statuses</option>
        <option value="Active">Active</option>
        <option value="Completed">Completed</option>
      </select>

      {/* Filter Tag */}
      {allTags.length > 0 && (
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          style={{
            padding: '11px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-main)',
            fontSize: '15px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="">All Tags</option>
          {allTags.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}

      {/* Filter Due Date Range */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CalendarRange size={15} style={{ color: 'var(--text-muted)' }} />
        <input
          type="date"
          value={dueDateFrom}
          onChange={(e) => setDueDateFrom(e.target.value)}
          title="Due date from"
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-main)',
            fontSize: '15px',
            outline: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)'
          }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>–</span>
        <input
          type="date"
          value={dueDateTo}
          onChange={(e) => setDueDateTo(e.target.value)}
          title="Due date to"
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-main)',
            fontSize: '15px',
            outline: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)'
          }}
        />
      </div>
    </div>
  );
};
