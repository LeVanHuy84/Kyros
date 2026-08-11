import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Task, RecurrenceRule } from '../../hooks/useTasks';

interface RecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  rule: RecurrenceRule | undefined;
  onSave: (
    taskId: string,
    pattern: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    interval: number
  ) => Promise<void>;
  isSaving: boolean;
}

export const RecurrenceModal: React.FC<RecurrenceModalProps> = ({
  isOpen,
  onClose,
  task,
  rule,
  onSave,
  isSaving,
}) => {
  const [form, setForm] = useState({
    pattern: 'DAILY' as 'DAILY' | 'WEEKLY' | 'MONTHLY',
    interval: 1,
  });

  useEffect(() => {
    if (task) {
      setForm({
        pattern: rule?.pattern || 'DAILY',
        interval: rule?.interval || 1,
      });
    }
  }, [task, rule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      await onSave(task.taskId, form.pattern, form.interval);
      onClose();
    } catch {
      // Error handled by custom hook state
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '36px',
          gap: '24px',
          boxShadow: 'var(--shadow-lg)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3
            style={{
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--text-main)',
              margin: 0,
            }}
          >
            Configure Task Recurrence
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--text-muted)',
            lineHeight: '1.5',
          }}
        >
          Turning this task into a recurring template will automatically
          generate child task instances based on your rule.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Pattern */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-main)',
              }}
            >
              Frequency Pattern
            </label>
            <select
              value={form.pattern}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, pattern: e.target.value as any }))
              }
              style={{
                padding: '11px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: '15px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          {/* Interval */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-main)',
              }}
            >
              Interval (positive integer)
            </label>
            <input
              type="number"
              required
              min={1}
              placeholder="e.g. 1 (every day/week/month), 2 (every other)"
              value={form.interval}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  interval: parseInt(e.target.value) || 1,
                }))
              }
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: '15px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Modal actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Configuring...' : 'Apply Template'}
          </button>
        </div>
      </form>
    </div>
  );
};
