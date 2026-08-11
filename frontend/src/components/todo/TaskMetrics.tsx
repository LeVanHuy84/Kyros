import React from 'react';
import type { TaskMetrics as MetricsType } from '../../hooks/useTasks';

interface TaskMetricsProps {
  metrics: MetricsType;
}

export const TaskMetrics: React.FC<TaskMetricsProps> = ({ metrics }) => {
  const items = [
    { label: 'Active Tasks', count: metrics.activeCount, color: 'var(--color-primary)' },
    { label: 'Completed Tasks', count: metrics.completedCount, color: 'var(--color-success)' },
    { label: 'Active Recurrence', count: metrics.recurrenceCount, color: 'var(--color-secondary)' },
    { label: 'Trash Bin', count: metrics.trashCount, color: 'var(--color-danger)' }
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
      gap: '20px' 
    }}>
      {items.map((item, idx) => (
        <div key={idx} className="card" style={{ padding: '24px', gap: '8px' }}>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '700', 
            textTransform: 'uppercase', 
            letterSpacing: '0.8px', 
            color: 'var(--text-muted)' 
          }}>
            {item.label}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)' }}>
              {item.count}
            </span>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: item.color 
            }} />
          </div>
        </div>
      ))}
    </div>
  );
};
