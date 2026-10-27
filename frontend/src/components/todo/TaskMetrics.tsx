import React, { useState, useEffect } from 'react';
import { Timer, Flame } from 'lucide-react';
import type { TaskMetrics as MetricsType } from '../../hooks/useTasks';
import { useWorkspace } from '../../hooks/useWorkspace';
import apiClient from '../../services/api-client';

interface TaskMetricsProps {
  metrics: MetricsType;
}

interface ProductivityStats {
  totalFocusedMinutes?: number;
  totalFocusMinutes?: number;
  totalSessionsCount?: number;
  totalSessionsLogged?: number;
  averageSessionMinutes?: number;
  onTimeCompletionRate?: number;
}

export const TaskMetrics: React.FC<TaskMetricsProps> = ({ metrics }) => {
  const { activeWorkspace } = useWorkspace();
  const [prodStats, setProdStats] = useState<ProductivityStats | null>(null);

  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchStats = async () => {
      try {
        const res = await apiClient.get(
          `/v1/workspaces/${activeWorkspace.id}/tasks/productivity/stats`
        );
        if (res.data) {
          setProdStats(res.data);
        }
      } catch {
        // Fallback gracefully
      }
    };
    fetchStats();
  }, [activeWorkspace]);

  const formatHours = (mins: number) => {
    if (!mins || mins === 0) return '0h';
    const hrs = (mins / 60).toFixed(1);
    return `${hrs}h`;
  };

  const totalFocusMins =
    prodStats?.totalFocusedMinutes ?? prodStats?.totalFocusMinutes ?? 0;
  const totalTasks = metrics.activeCount + metrics.completedCount;
  const completionRate =
    totalTasks > 0
      ? Math.round((metrics.completedCount / totalTasks) * 100)
      : 100;

  const items = [
    {
      label: 'Active Tasks',
      count: metrics.activeCount,
      color: 'var(--color-primary)',
    },
    {
      label: 'Completed',
      count: metrics.completedCount,
      color: 'var(--color-success)',
    },
    {
      label: 'Focus Time',
      count: formatHours(totalFocusMins),
      color: '#6366f1',
      icon: <Timer size={14} style={{ color: '#6366f1' }} />,
    },
    {
      label: 'Completion Rate',
      count: `${completionRate}%`,
      color: '#f59e0b',
      icon: <Flame size={14} style={{ color: '#f59e0b' }} />,
    },
    {
      label: 'Trash Bin',
      count: metrics.trashCount,
      color: 'var(--color-danger)',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px',
      }}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          className="card"
          style={{ padding: '18px 20px', gap: '6px' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: 'var(--text-muted)',
              }}
            >
              {item.label}
            </span>
            {item.icon}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              marginTop: '2px',
            }}
          >
            <span
              style={{
                fontSize: '26px',
                fontWeight: '800',
                color: 'var(--text-main)',
              }}
            >
              {item.count}
            </span>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
