import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Trash2,
  Edit2,
  Link2,
  ExternalLink,
} from 'lucide-react';
import type { CalendarEvent } from './types';
import { useTasks } from '../../hooks/useTasks';

interface EventDetailsDrawerProps {
  selectedEvent: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (eventId: string) => void;
  onReschedule: (eventId: string, start: string, end: string) => Promise<void>;
  onAddReminder: (offsetMinutes: number) => Promise<void>;
  onRemoveReminder: (reminderId: string) => Promise<void>;
  onEditClick: (event: CalendarEvent) => void;
  conflictingEvents: CalendarEvent[];
}

export const EventDetailsDrawer: React.FC<EventDetailsDrawerProps> = ({
  selectedEvent,
  isOpen,
  onClose,
  onDelete,
  onReschedule,
  onAddReminder,
  onRemoveReminder,
  onEditClick,
  conflictingEvents,
}) => {
  const { tasks } = useTasks();
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [rescheduleStart, setRescheduleStart] = useState<string>('');
  const [rescheduleEnd, setRescheduleEnd] = useState<string>('');
  const [newReminderOffset, setNewReminderOffset] = useState<string>('15');

  const linkedTask = selectedEvent?.taskId
    ? tasks.find((t) => t.taskId === selectedEvent.taskId)
    : null;

  useEffect(() => {
    if (selectedEvent) {
      const formatLocal = (iso: string) => {
        const d = new Date(iso);
        const pad = (n: number) => (n < 10 ? '0' + n : n);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
          d.getHours()
        )}:${pad(d.getMinutes())}`;
      };
      setRescheduleStart(formatLocal(selectedEvent.startTime));
      setRescheduleEnd(formatLocal(selectedEvent.endTime));
      setIsRescheduling(false);
    }
  }, [selectedEvent]);

  if (!isOpen || !selectedEvent) return null;

  const handleRescheduleSubmit = async () => {
    if (
      new Date(rescheduleStart).getTime() >= new Date(rescheduleEnd).getTime()
    ) {
      alert('End time must be after start time.');
      return;
    }
    await onReschedule(selectedEvent.eventId, rescheduleStart, rescheduleEnd);
    setIsRescheduling(false);
  };

  return (
    <div
      className="details-drawer"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '420px',
        backgroundColor: 'var(--bg-card)',
        boxShadow: 'var(--shadow-lg)',
        borderLeft: '1px solid var(--border-color)',
        zIndex: 100,
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: '700',
            color: 'var(--color-primary)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Event Details
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
          aria-label="Close details"
        >
          <X size={20} />
        </button>
      </div>

      <div>
        <h3
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: '700',
            margin: '0 0 6px 0',
            color: 'var(--text-main)',
          }}
        >
          {selectedEvent.title}
        </h3>
        <span
          style={{
            fontSize: '12px',
            fontWeight: '600',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: 'var(--color-success)',
          }}
        >
          {selectedEvent.status}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span
          style={{
            fontSize: '14px',
            fontWeight: '700',
            color: 'var(--text-muted)',
          }}
        >
          Timing Range
        </span>
        <div
          style={{
            fontSize: '15px',
            color: 'var(--text-main)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <span>
            Start:{' '}
            {new Date(selectedEvent.startTime).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span>
            End:{' '}
            {new Date(selectedEvent.endTime).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {selectedEvent.description && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: '700',
              color: 'var(--text-muted)',
            }}
          >
            Description
          </span>
          <p
            style={{
              margin: 0,
              fontSize: '15px',
              color: 'var(--text-main)',
              lineHeight: '1.6',
            }}
          >
            {selectedEvent.description}
          </p>
        </div>
      )}

      {/* Linked Task */}
      {selectedEvent.taskId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: '700',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Link2 size={14} />
            Linked Task
          </span>
          {linkedTask ? (
            <div
              style={{
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: 'var(--text-main)',
                    textDecoration:
                      linkedTask.status === 'Completed'
                        ? 'line-through'
                        : 'none',
                    opacity: linkedTask.status === 'Completed' ? 0.7 : 1,
                    flexGrow: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {linkedTask.title}
                </span>
                <ExternalLink
                  size={14}
                  style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  className={`badge ${
                    linkedTask.priority === 'High'
                      ? 'badge-high'
                      : linkedTask.priority === 'Medium'
                        ? 'badge-medium'
                        : 'badge-low'
                  }`}
                  style={{ fontSize: '11px' }}
                >
                  {linkedTask.priority}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor:
                      linkedTask.status === 'Completed'
                        ? 'rgba(16,185,129,0.1)'
                        : 'rgba(99,102,241,0.1)',
                    color:
                      linkedTask.status === 'Completed'
                        ? 'var(--color-success)'
                        : 'var(--color-primary)',
                  }}
                >
                  {linkedTask.status}
                </span>
                {linkedTask.dueDate && (
                  <span
                    style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                  >
                    Due{' '}
                    {new Date(linkedTask.dueDate).toLocaleDateString(
                      undefined,
                      { month: 'short', day: 'numeric' }
                    )}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'var(--bg-app)',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                fontSize: '13px',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              Task not found or may have been deleted.
            </div>
          )}
        </div>
      )}

      {/* Overlap Alarm Indicator */}
      {conflictingEvents.length > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertTriangle
            size={20}
            style={{
              color: 'var(--color-danger)',
              flexShrink: 0,
              marginTop: '2px',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span
              style={{
                fontSize: '14px',
                fontWeight: '700',
                color: 'var(--color-danger)',
              }}
            >
              Active Schedule Overlap
            </span>
            <span
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                lineHeight: '1.4',
              }}
            >
              This event conflicts with:{' '}
              {conflictingEvents.map((e) => `"${e.title}"`).join(', ')}.
            </span>
          </div>
        </div>
      )}

      {/* Reminders manager */}
      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: '700',
            color: 'var(--text-muted)',
          }}
        >
          Event Alerts
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {selectedEvent.reminders.length === 0 ? (
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              No reminders configured.
            </span>
          ) : (
            selectedEvent.reminders.map((reminder) => (
              <div
                key={reminder.reminderId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-app)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>
                  {reminder.leadTimeMinutes} mins before event
                </span>
                <button
                  onClick={() => onRemoveReminder(reminder.reminderId)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                  }}
                  aria-label="Remove reminder"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <input
            type="number"
            value={newReminderOffset}
            onChange={(e) => setNewReminderOffset(e.target.value)}
            style={{
              width: '80px',
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              fontSize: '14px',
            }}
          />
          <button
            onClick={() => onAddReminder(parseInt(newReminderOffset) || 15)}
            className="btn btn-secondary"
            style={{ flexGrow: 1 }}
          >
            Add Reminder
          </button>
        </div>
      </div>

      {/* Drawer Actions */}
      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px',
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {isRescheduling ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: 'var(--bg-app)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-muted)',
              }}
            >
              Reschedule Interval
            </span>
            <input
              type="datetime-local"
              value={rescheduleStart}
              onChange={(e) => setRescheduleStart(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
              }}
            />
            <input
              type="datetime-local"
              value={rescheduleEnd}
              onChange={(e) => setRescheduleEnd(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleRescheduleSubmit}
                className="btn btn-primary"
                style={{ flexGrow: 1 }}
              >
                Confirm
              </button>
              <button
                onClick={() => setIsRescheduling(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => setIsRescheduling(true)}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Reschedule Time
            </button>
            <button
              onClick={() => onEditClick(selectedEvent)}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Edit2 size={16} />
              <span>Edit Metadata</span>
            </button>
            <button
              onClick={() => onDelete(selectedEvent.eventId)}
              className="btn btn-secondary"
              style={{
                width: '100%',
                justifyContent: 'center',
                borderColor: 'var(--color-danger)',
                color: 'var(--color-danger)',
              }}
            >
              <Trash2 size={16} />
              <span>Delete Event</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
