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
  RotateCcw,
} from 'lucide-react';

import type { Task, RecurrenceRule } from '../../hooks/useTasks';
import type { WorkspaceTag } from '../../hooks/useWorkspaceTags';

interface TaskCardProps {
  task: Task;
  rule: RecurrenceRule | undefined;
  activeTab: 'all' | 'recurrence' | 'trash';
  workspaceTags: WorkspaceTag[];

  onToggleComplete: (task: Task) => void;
  onConfigureRecurrence: (task: Task) => void;
  onEdit: (task: Task) => void;
  onSoftDelete: (taskId: string) => void;
  onRecover: (taskId: string) => void;

  onRecurrenceAction: (
    taskId: string,
    action: 'pause' | 'resume' | 'stop'
  ) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  rule,
  activeTab,
  workspaceTags,
  onToggleComplete,
  onConfigureRecurrence,
  onEdit,
  onSoftDelete,
  onRecover,
  onRecurrenceAction,
}) => {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (task.status === 'SoftDeleted') {
      const interval = setInterval(() => {
        setNow(Date.now());
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [task.status]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';

    const date = new Date(dateStr);

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRemainingTrashTime = (deletedAtStr: string | null) => {
    if (!deletedAtStr) return '';

    const deletedTime = new Date(deletedAtStr).getTime();
    const expiryTime = deletedTime + 7200000;
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

  const isPurging =
    task.status === 'SoftDeleted' &&
    getRemainingTrashTime(task.deletedAt) === 'Purging...';

  return (
    <div
      className="task-card"
      data-task-tab={activeTab}
      style={{
        padding: '20px 24px',
        border:
          task.status === 'Completed'
            ? '1px solid rgba(16, 185, 129, 0.2)'
            : '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px',
        backgroundColor:
          task.status === 'Completed'
            ? 'rgba(16, 185, 129, 0.02)'
            : 'var(--bg-app)',
        boxShadow: 'var(--shadow-sm)',
        opacity:
          task.status === 'SoftDeleted'
            ? 0.75
            : task.status === 'Completed'
              ? 0.8
              : 1,
        transition:
          'border-color var(--transition-fast), box-shadow var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor =
          task.status === 'Completed'
            ? 'var(--color-success)'
            : 'var(--color-primary)';

        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor =
          task.status === 'Completed'
            ? 'rgba(16, 185, 129, 0.2)'
            : 'var(--border-color)';

        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {/* ============================================================
          Main task content
          Desktop: horizontal
          Mobile: checkbox + content
          ============================================================ */}
      <div
        className="task-card-main"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          flex: '1 1 auto',
          minWidth: 0,
        }}
      >
        {/* Completion checkbox */}
        {task.status !== 'SoftDeleted' && (
          <button
            onClick={() => onToggleComplete(task)}
            aria-label={
              task.status === 'Completed' ? 'Mark active' : 'Complete task'
            }
            style={{
              flex: '0 0 auto',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color:
                task.status === 'Completed'
                  ? 'var(--color-success)'
                  : 'var(--text-muted)',
              padding: 0,
              marginTop: '2px',
              transition: 'color var(--transition-fast)',
            }}
          >
            <CheckCircle2
              size={22}
              fill={
                task.status === 'Completed'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'transparent'
              }
            />
          </button>
        )}

        {/* ============================================================
            Task body
            ============================================================ */}
        <div
          className="task-card-texts"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: '1 1 auto',
            minWidth: 0,
          }}
        >
          {/* Title + priority + recurrence */}
          <div
            className="task-card-title-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              minWidth: 0,
            }}
          >
            <span
              className="task-card-title"
              style={{
                minWidth: 0,
                fontWeight: '600',
                fontSize: '16px',
                lineHeight: '1.4',
                color: 'var(--text-main)',
                textDecoration:
                  task.status === 'Completed' ? 'line-through' : 'none',
                opacity: task.status === 'Completed' ? 0.6 : 1,
              }}
            >
              {task.title}
            </span>

            <span
              className={`badge ${
                task.priority === 'High'
                  ? 'badge-high'
                  : task.priority === 'Medium'
                    ? 'badge-medium'
                    : 'badge-low'
              }`}
              style={{
                flex: '0 0 auto',
                whiteSpace: 'nowrap',
              }}
            >
              {task.priority}
            </span>

            {rule && rule.recurrenceStatus && (
              <span
                className={`badge ${
                  rule.recurrenceStatus === 'Active'
                    ? 'badge-success'
                    : 'badge-muted'
                }`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  flex: '0 0 auto',
                  whiteSpace: 'nowrap',
                }}
              >
                <RefreshCw
                  size={11}
                  className={
                    rule.recurrenceStatus === 'Active' ? 'spin-slow' : ''
                  }
                />
                {rule.pattern} ({rule.interval}x) - {rule.recurrenceStatus}
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p
              className="task-card-description"
              style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--text-muted)',
                lineHeight: '1.5',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textDecoration:
                  task.status === 'Completed' ? 'line-through' : 'none',
                opacity: task.status === 'Completed' ? 0.6 : 1,
              }}
            >
              {task.description}
            </p>
          )}

          {/* ============================================================
              Metadata
              ============================================================ */}
          <div
            className="task-card-meta"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              marginTop: '4px',
              minWidth: 0,
            }}
          >
            {task.dueDate && (
              <div
                className="task-card-due-date"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  flex: '0 0 auto',
                  whiteSpace: 'nowrap',
                }}
              >
                <Calendar size={14} />

                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}

            {task.status === 'SoftDeleted' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: 'var(--color-danger)',
                  fontWeight: '600',
                  flex: '0 0 auto',
                  whiteSpace: 'nowrap',
                }}
              >
                <Clock size={14} />

                <span>{getRemainingTrashTime(task.deletedAt)}</span>
              </div>
            )}

            {task.tags && task.tags.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  minWidth: 0,
                }}
              >
                {task.tags.map((t) => {
                  const wt = workspaceTags.find((w) => w.name === t);

                  const color = wt?.color ?? null;

                  if (color) {
                    return (
                      <span
                        key={t}
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: `${color}26`,
                          border: `1px solid ${color}66`,
                          color,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <TagIcon size={10} />
                        {t}
                      </span>
                    );
                  }

                  return (
                    <span
                      key={t}
                      className="badge badge-muted"
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <TagIcon size={10} />
                      {t}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================
          Actions
          Desktop: right side
          Mobile: own row
          ================================================================ */}
      <div
        className="task-card-actions"
        data-task-tab={activeTab}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '10px',
          flex: '0 0 auto',
        }}
      >
        {/* ALL */}
        {activeTab === 'all' && (
          <>
            <button
              onClick={() => onConfigureRecurrence(task)}
              className="btn btn-secondary"
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
              title="Configure Recurrence Pattern"
            >
              <RefreshCw size={14} />
              <span>Recurrence</span>
            </button>

            <button
              onClick={() => onEdit(task)}
              className="btn btn-secondary"
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
              title="Edit Task"
            >
              <Edit3 size={14} />
            </button>

            <button
              onClick={() => onSoftDelete(task.taskId)}
              className="btn btn-danger"
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
              title="Soft Delete"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}

        {/* RECURRENCE */}
        {activeTab === 'recurrence' && rule && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            {rule.recurrenceStatus === 'Active' && (
              <button
                onClick={() => onRecurrenceAction(task.taskId, 'pause')}
                className="btn btn-secondary"
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Pause size={14} />
                <span>Pause</span>
              </button>
            )}

            {rule.recurrenceStatus === 'Paused' && (
              <button
                onClick={() => onRecurrenceAction(task.taskId, 'resume')}
                className="btn btn-primary"
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  backgroundColor: 'var(--color-success)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Play size={14} />
                <span>Resume</span>
              </button>
            )}

            {rule.recurrenceStatus !== 'Stopped' && (
              <button
                onClick={() => onRecurrenceAction(task.taskId, 'stop')}
                className="btn btn-danger"
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                }}
              >
                <StopCircle size={14} />
                <span>Stop</span>
              </button>
            )}
          </div>
        )}

        {/* TRASH */}
        {activeTab === 'trash' && (
          <button
            onClick={() => onRecover(task.taskId)}
            className="btn btn-success"
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              whiteSpace: 'nowrap',
            }}
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
