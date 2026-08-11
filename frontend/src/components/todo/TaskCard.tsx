import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Tag as TagIcon, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Play, 
  Pause, 
  StopCircle, 
  Edit3, 
  Trash2,
  RotateCcw
} from 'lucide-react';
import type { Task, RecurrenceRule } from '../../hooks/useTasks';

interface TaskCardProps {
  task: Task;
  rule: RecurrenceRule | undefined;
  activeTab: 'all' | 'recurrence' | 'trash';
  onToggleComplete: (task: Task) => void;
  onConfigureRecurrence: (task: Task) => void;
  onEdit: (task: Task) => void;
  onSoftDelete: (taskId: string) => void;
  onRecover: (taskId: string) => void;
  onRecurrenceAction: (taskId: string, action: 'pause' | 'resume' | 'stop') => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  rule,
  activeTab,
  onToggleComplete,
  onConfigureRecurrence,
  onEdit,
  onSoftDelete,
  onRecover,
  onRecurrenceAction
}) => {
  const [now, setNow] = useState<number>(Date.now());

  // Set interval for trash item timer
  useEffect(() => {
    if (task.status === 'SoftDeleted') {
      const interval = setInterval(() => setNow(Date.now()), 15000);
      return () => clearInterval(interval);
    }
  }, [task.status]);

  // Helper: Format Dates cleanly
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper: Calculate Remaining Soft Delete Window (2 hours max)
  const getRemainingTrashTime = (deletedAtStr: string | null) => {
    if (!deletedAtStr) return '';
    const deletedTime = new Date(deletedAtStr).getTime();
    const expiryTime = deletedTime + 7200000; // 2 hours
    const diff = expiryTime - now;

    if (diff <= 0) return 'Purging...';

    const mins = Math.floor(diff / 60000);
    if (mins > 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hrs}h ${remainingMins}m left`;
    }
    return `${mins}m left`;
  };

  const isPurging = task.status === 'SoftDeleted' && getRemainingTrashTime(task.deletedAt) === 'Purging...';

  return (
    <div 
      style={{
        padding: '20px 24px',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px',
        backgroundColor: 'var(--bg-app)',
        boxShadow: 'var(--shadow-sm)',
        opacity: task.status === 'SoftDeleted' ? 0.75 : 1,
        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      
      {/* Left: Task Content details */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexGrow: 1, minWidth: 0 }}>
        
        {/* Completion Checkbox */}
        {task.status !== 'SoftDeleted' && (
          <button
            onClick={() => onToggleComplete(task)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: task.status === 'Completed' ? 'var(--color-success)' : 'var(--text-muted)',
              padding: 0,
              marginTop: '2px',
              transition: 'color var(--transition-fast)'
            }}
            aria-label={task.status === 'Completed' ? 'Mark active' : 'Complete task'}
          >
            <CheckCircle2 
              size={22} 
              fill={task.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'transparent'} 
            />
          </button>
        )}

        {/* Task texts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0, width: '100%' }}>
          
          {/* Title & Priority */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ 
              fontWeight: '600', 
              fontSize: '16px', 
              color: 'var(--text-main)',
              textDecoration: task.status === 'Completed' ? 'line-through' : 'none',
              opacity: task.status === 'Completed' ? 0.6 : 1
            }}>
              {task.title}
            </span>
            
            <span className={`badge ${
              task.priority === 'High' ? 'badge-high' : task.priority === 'Medium' ? 'badge-medium' : 'badge-low'
            }`}>
              {task.priority}
            </span>

            {/* Recurrence Rule Indicator */}
            {rule && rule.recurrenceStatus && (
              <span className={`badge ${
                rule.recurrenceStatus === 'Active' ? 'badge-success' : 'badge-muted'
              }`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <RefreshCw size={11} className={rule.recurrenceStatus === 'Active' ? 'spin-slow' : ''} />
                {rule.pattern} ({rule.interval}x) - {rule.recurrenceStatus}
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              color: 'var(--text-muted)', 
              lineHeight: '1.5',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {task.description}
            </p>
          )}

          {/* Bottom Line: Due Date & Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
            
            {/* Due Date */}
            {task.dueDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <Calendar size={14} />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}

            {/* Soft Delete Countdown */}
            {task.status === 'SoftDeleted' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-danger)', fontWeight: '600' }}>
                <Clock size={14} />
                <span>{getRemainingTrashTime(task.deletedAt)}</span>
              </div>
            )}

            {/* Tags list */}
            {task.tags && task.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {task.tags.map(t => (
                  <span 
                    key={t} 
                    className="badge badge-muted" 
                    style={{ 
                      fontSize: '11px', 
                      padding: '2px 8px', 
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <TagIcon size={10} />
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Right: Action Buttons based on Tab */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        
        {/* All Tasks Tab actions */}
        {activeTab === 'all' && (
          <>
            <button
              onClick={() => onConfigureRecurrence(task)}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '13px' }}
              title="Configure Recurrence Pattern"
            >
              <RefreshCw size={14} />
              <span>Recurrence</span>
            </button>

            <button
              onClick={() => onEdit(task)}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '13px' }}
              title="Edit Task"
            >
              <Edit3 size={14} />
            </button>

            <button
              onClick={() => onSoftDelete(task.taskId)}
              className="btn btn-danger"
              style={{ padding: '8px 12px', fontSize: '13px' }}
              title="Soft Delete"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}

        {/* Recurrence Template controls */}
        {activeTab === 'recurrence' && rule && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {rule.recurrenceStatus === 'Active' && (
              <button
                onClick={() => onRecurrenceAction(task.taskId, 'pause')}
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '13px' }}
              >
                <Pause size={14} />
                <span>Pause</span>
              </button>
            )}
            {rule.recurrenceStatus === 'Paused' && (
              <button
                onClick={() => onRecurrenceAction(task.taskId, 'resume')}
                className="btn btn-primary"
                style={{ padding: '8px 12px', fontSize: '13px', backgroundColor: 'var(--color-success)' }}
              >
                <Play size={14} />
                <span>Resume</span>
              </button>
            )}
            {rule.recurrenceStatus !== 'Stopped' && (
              <button
                onClick={() => onRecurrenceAction(task.taskId, 'stop')}
                className="btn btn-danger"
                style={{ padding: '8px 12px', fontSize: '13px' }}
              >
                <StopCircle size={14} />
                <span>Stop</span>
              </button>
            )}
          </div>
        )}

        {/* Trash Tab actions */}
        {activeTab === 'trash' && (
          <button
            onClick={() => onRecover(task.taskId)}
            className="btn btn-success"
            style={{ padding: '8px 14px', fontSize: '13px' }}
            disabled={isPurging}
          >
            <RotateCcw size={14} />
            <span>Recover</span>
          </button>
        )}

      </div>

    </div>
  );
};
