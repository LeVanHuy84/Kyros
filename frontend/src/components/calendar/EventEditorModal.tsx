import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { CalendarEvent } from './types';
import { useTasks } from '../../hooks/useTasks';

interface EventEditorModalProps {
  isOpen: boolean;
  isEditing: boolean;
  selectedEvent: CalendarEvent | null;
  prefilledStart: Date | null;
  onClose: () => void;
  onSave: (
    title: string,
    desc: string,
    taskId: string,
    start: string,
    end: string,
    reminders: number[]
  ) => Promise<void>;
}

export const EventEditorModal: React.FC<EventEditorModalProps> = ({
  isOpen,
  isEditing,
  selectedEvent,
  prefilledStart,
  onClose,
  onSave,
}) => {
  const { tasks } = useTasks();
  const [title, setTitle] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [reminders, setReminders] = useState<number[]>([]);
  const [submitError, setSubmitError] = useState<string>('');

  const formatLocal = (d: Date) => {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (isOpen) {
      setSubmitError('');
      if (isEditing && selectedEvent) {
        setTitle(selectedEvent.title);
        setDesc(selectedEvent.description || '');
        setSelectedTaskId(selectedEvent.taskId || '');
        const formatLocalIso = (iso: string) => formatLocal(new Date(iso));
        setStart(formatLocalIso(selectedEvent.startTime));
        setEnd(formatLocalIso(selectedEvent.endTime));
        setReminders(selectedEvent.reminders.map((r) => r.leadTimeMinutes));
      } else {
        setTitle('');
        setDesc('');
        setSelectedTaskId('');
        const startDay = prefilledStart || new Date();
        const endDay = new Date(startDay.getTime() + 60 * 60 * 1000);
        setStart(formatLocal(startDay));
        setEnd(formatLocal(endDay));
        setReminders([15]);
      }
    }
  }, [isOpen, isEditing, selectedEvent, prefilledStart]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!title.trim()) {
      setSubmitError('Please enter an event title.');
      return;
    }

    if (new Date(start).getTime() >= new Date(end).getTime()) {
      setSubmitError('End time must be strictly after start time.');
      return;
    }

    try {
      await onSave(title, desc, selectedTaskId, start, end, reminders);
    } catch (err: any) {
      setSubmitError(
        err.friendlyMessage ||
          'Failed to save event. Overlap conflicts may exist.'
      );
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '24px',
      }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: '520px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '700',
              margin: 0,
              color: 'var(--text-main)',
            }}
          >
            {isEditing ? 'Edit Calendar Event' : 'Book New Event'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
            aria-label="Close form"
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            overflowY: 'auto',
            maxHeight: '70vh',
          }}
        >
          {submitError && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
              }}
            >
              {submitError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-muted)',
              }}
            >
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. System Integration Review"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                height: '44px',
                padding: '0 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: '15px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-muted)',
              }}
            >
              Description
            </label>
            <textarea
              placeholder="Add optional notes or agendas"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: '15px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-muted)',
              }}
            >
              Associated Task (Optional)
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              style={{
                height: '44px',
                padding: '0 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: '15px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">-- No Linked Task --</option>
              {tasks.map((t) => (
                <option key={t.taskId} value={t.taskId}>
                  {t.title} ({t.priority})
                  {t.dueDate
                    ? ` - Due: ${new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          <div
            className="form-row-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
            }}
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
            >
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                }}
              >
                Start Time
              </label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                style={{
                  height: '44px',
                  padding: '0 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                }}
              />
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
            >
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                }}
              >
                End Time
              </label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                style={{
                  height: '44px',
                  padding: '0 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          {!isEditing && (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
            >
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: 'var(--text-muted)',
                }}
              >
                Default Alert Offsets (minutes before)
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[5, 15, 30, 60].map((mins) => {
                  const selected = reminders.includes(mins);
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setReminders((prev) =>
                            prev.filter((m) => m !== mins)
                          );
                        } else {
                          setReminders((prev) => [...prev, mins]);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${selected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                        backgroundColor: selected
                          ? 'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.1)'
                          : 'var(--bg-app)',
                        color: selected
                          ? 'var(--color-primary)'
                          : 'var(--text-muted)',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      {mins} mins
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save Commitments
          </button>
        </div>
      </form>
    </div>
  );
};
