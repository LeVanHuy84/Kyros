import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';

interface ActiveReminder {
  eventId: string;
  eventTitle: string;
  reminderId: string;
  leadTime: number;
}

interface ReminderToastsProps {
  activeReminders: ActiveReminder[];
  onSnooze: (eventId: string, reminderId: string, minutes: number) => void;
  onDismiss: (eventId: string, reminderId: string) => void;
}

export const ReminderToasts: React.FC<ReminderToastsProps> = ({
  activeReminders,
  onSnooze,
  onDismiss,
}) => {
  const [snoozeMinutes, setSnoozeMinutes] = useState<number>(5);

  if (activeReminders.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: 'min(380px, calc(100vw - 32px))',
        width: '100%',
      }}
    >
      {activeReminders.map((reminder) => (
        <div
          key={reminder.reminderId}
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '4px solid var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Bell size={20} style={{ color: 'var(--color-primary)' }} />
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                }}
              >
                Upcoming Event Reminder
              </span>
            </div>
            <button
              onClick={() => onDismiss(reminder.eventId, reminder.reminderId)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
              aria-label="Close notification"
            >
              <X size={16} />
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
            Event "{reminder.eventTitle}" is scheduled to start in{' '}
            {reminder.leadTime} minutes.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              marginTop: '4px',
              flexWrap: 'wrap',
            }}
          >
            <select
              value={snoozeMinutes}
              onChange={(e) => setSnoozeMinutes(parseInt(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: '13px',
              }}
            >
              <option value={5}>5 mins</option>
              <option value={10}>10 mins</option>
              <option value={15}>15 mins</option>
              <option value={30}>30 mins</option>
            </select>

            <button
              onClick={() =>
                onSnooze(reminder.eventId, reminder.reminderId, snoozeMinutes)
              }
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Snooze
            </button>
            <button
              onClick={() => onDismiss(reminder.eventId, reminder.reminderId)}
              style={{
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
