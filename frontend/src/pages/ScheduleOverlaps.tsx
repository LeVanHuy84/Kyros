import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle,
  Plus,
  ShieldAlert,
  Clock,
  Trash2,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string; // HH:MM
  end: string; // HH:MM
  type: 'system' | 'user';
}

interface CollisionLog {
  id: string;
  time: string;
  requestedEvent: string;
  conflictingEvent: string;
  status: 'blocked' | 'resolved';
}

const ScheduleOverlaps: React.FC = () => {
  // Preset calendar events
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Q3 Planning Strategy Session',
      start: '09:00',
      end: '11:00',
      type: 'system',
    },
    {
      id: '2',
      title: 'Executive Sync Bounded Block',
      start: '11:30',
      end: '13:00',
      type: 'system',
    },
    {
      id: '3',
      title: 'Team Architecture Standup',
      start: '14:00',
      end: '15:30',
      type: 'system',
    },
    {
      id: '4',
      title: 'Technical Stack Refactoring',
      start: '16:00',
      end: '17:30',
      type: 'user',
    },
  ]);

  // Intercepted collision log
  const [collisionLogs, setCollisionLogs] = useState<CollisionLog[]>([
    {
      id: 'c1',
      time: '14:02',
      requestedEvent: 'Client Pitch Meeting',
      conflictingEvent: 'Team Architecture Standup',
      status: 'blocked',
    },
    {
      id: 'c2',
      time: '09:30',
      requestedEvent: 'Urgent Ops Sync',
      conflictingEvent: 'Q3 Planning Strategy Session',
      status: 'blocked',
    },
  ]);

  // Form states
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventStart, setNewEventStart] = useState('10:00');
  const [newEventEnd, setNewEventEnd] = useState('11:30');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Convert HH:MM to total minutes
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Check if two intervals overlap
  const isOverlapping = (
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean => {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    return s1 < e2 && s2 < e1;
  };

  const handleScheduleTest = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newEventTitle.trim()) {
      setFormError('Please enter a valid event name.');
      return;
    }

    if (timeToMinutes(newEventStart) >= timeToMinutes(newEventEnd)) {
      setFormError('End time must be after the start time.');
      return;
    }

    // Check overlaps
    const collision = events.find((event) =>
      isOverlapping(newEventStart, newEventEnd, event.start, event.end)
    );

    if (collision) {
      // Log blocked event
      const logEntry: CollisionLog = {
        id: 'c_' + Date.now(),
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        requestedEvent: newEventTitle,
        conflictingEvent: collision.title,
        status: 'blocked',
      };
      setCollisionLogs((prev) => [logEntry, ...prev]);
      setFormError(
        `Collision Prevented! Unable to schedule "${newEventTitle}" because it conflicts with "${collision.title}" (${collision.start} - ${collision.end}).`
      );
    } else {
      // Add scheduled event
      const addedEvent: CalendarEvent = {
        id: 'e_' + Date.now(),
        title: newEventTitle,
        start: newEventStart,
        end: newEventEnd,
        type: 'user',
      };
      setEvents((prev) =>
        [...prev, addedEvent].sort(
          (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
        )
      );
      setFormSuccess(
        `Successfully Scheduled! "${newEventTitle}" has been booked without any collisions.`
      );
      setNewEventTitle('');
    }
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  const handleClearLogs = () => {
    setCollisionLogs([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Overview Block */}
      <div className="card interactive-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CalendarIcon
            size={24}
            style={{ color: 'var(--color-primary)' }}
            aria-hidden="true"
          />
          <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
            Collision Detection System
          </h3>
        </div>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '15px',
            margin: 0,
            lineHeight: '1.6',
          }}
        >
          Kyros automatically monitors timelines using a strict bounded-interval
          model. If an incoming event overlaps with an existing block assigned
          within the same tenant context, the scheduler intercepts the operation
          to protect operational stability.
        </p>

        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <ShieldAlert
            size={22}
            style={{
              color: 'var(--color-success)',
              flexShrink: 0,
              marginTop: '2px',
            }}
            aria-hidden="true"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span
              style={{
                fontSize: '15px',
                color: 'var(--text-main)',
                fontWeight: '600',
              }}
            >
              Active Overlap Guard Enabled
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Scheduler is enforcing interval boundaries. All conflicting
              operations will be logged and blocked.
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '28px',
        }}
      >
        {/* Left Column - Sandbox Input */}
        <div className="card">
          <h3
            style={{
              fontSize: '20px',
              fontWeight: '600',
              margin: 0,
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '12px',
            }}
          >
            Schedule Tester Sandbox
          </h3>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '15px',
              margin: 0,
              lineHeight: '1.5',
            }}
          >
            Enter event details below to test the active overlap prevention
            engine in real time.
          </p>

          <form
            onSubmit={handleScheduleTest}
            style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <label
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-muted)',
                }}
              >
                Event Title
              </label>
              <input
                type="text"
                placeholder="e.g., Q3 Operations Briefing"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                style={{
                  height: '48px',
                  padding: '0 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  fontSize: '15px',
                  transition: 'border-color var(--transition-fast)',
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}
            >
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <label
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                  }}
                >
                  Start Time
                </label>
                <input
                  type="time"
                  value={newEventStart}
                  onChange={(e) => setNewEventStart(e.target.value)}
                  style={{
                    height: '48px',
                    padding: '0 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'border-color var(--transition-fast)',
                  }}
                />
              </div>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <label
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                  }}
                >
                  End Time
                </label>
                <input
                  type="time"
                  value={newEventEnd}
                  onChange={(e) => setNewEventEnd(e.target.value)}
                  style={{
                    height: '48px',
                    padding: '0 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'border-color var(--transition-fast)',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ height: '48px', fontSize: '15px', width: '100%' }}
            >
              <Plus size={18} />
              <span>Test Event Scheduling</span>
            </button>
          </form>

          {/* Feedback states */}
          {formError && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                padding: '18px 20px',
                borderRadius: 'var(--radius-md)',
                fontSize: '15px',
                lineHeight: '1.5',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <AlertTriangle
                size={20}
                style={{ flexShrink: 0, marginTop: '2px' }}
              />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid var(--color-success)',
                color: 'var(--color-success)',
                padding: '18px 20px',
                borderRadius: 'var(--radius-md)',
                fontSize: '15px',
                lineHeight: '1.5',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <CheckCircle
                size={20}
                style={{ flexShrink: 0, marginTop: '2px' }}
              />
              <span>{formSuccess}</span>
            </div>
          )}
        </div>

        {/* Right Column - Timeline List & Interceptions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Active Timeline */}
          <div className="card">
            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: 0,
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '12px',
              }}
            >
              Active Timeline Blocks
            </h3>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                maxHeight: '360px',
                overflowY: 'auto',
              }}
            >
              {events.length === 0 ? (
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '15px',
                    textAlign: 'center',
                    padding: '24px 0',
                  }}
                >
                  No scheduled blocks. Bounded timeline context is clear.
                </p>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 20px',
                      backgroundColor: 'var(--bg-app)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '40px',
                          borderRadius: '4px',
                          backgroundColor:
                            event.type === 'system'
                              ? 'var(--color-primary)'
                              : 'var(--color-secondary)',
                        }}
                      />
                      <div>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'var(--text-main)',
                          }}
                        >
                          {event.title}
                        </h4>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '6px',
                            color: 'var(--text-muted)',
                            fontSize: '13px',
                          }}
                        >
                          <Clock size={14} />
                          <span>
                            {event.start} - {event.end}
                          </span>
                          <span
                            className={`badge ${event.type === 'system' ? 'badge-low' : 'badge-medium'}`}
                            style={{ fontSize: '11px', marginLeft: '8px' }}
                          >
                            {event.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          'rgba(239, 68, 68, 0.08)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                      title="Remove event"
                    >
                      <Trash2
                        size={18}
                        style={{ color: 'var(--color-danger)' }}
                      />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Interception Logs */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '12px',
              }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
                Interception Log
              </h3>
              {collisionLogs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--color-danger)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Clear History
                </button>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                maxHeight: '300px',
                overflowY: 'auto',
              }}
            >
              {collisionLogs.length === 0 ? (
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '15px',
                    textAlign: 'center',
                    padding: '16px 0',
                  }}
                >
                  No recent schedule collisions detected.
                </p>
              ) : (
                collisionLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 20px',
                      backgroundColor: 'rgba(239, 68, 68, 0.02)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <AlertTriangle
                      size={18}
                      style={{
                        color: 'var(--color-danger)',
                        marginTop: '2px',
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span
                          className="badge badge-danger"
                          style={{ fontSize: '11px' }}
                        >
                          BLOCKED
                        </span>
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          at {log.time}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: '4px 0 0 0',
                          fontSize: '14px',
                          color: 'var(--text-main)',
                          lineHeight: '1.5',
                        }}
                      >
                        Rejected scheduling request for{' '}
                        <strong>"{log.requestedEvent}"</strong>.
                      </p>
                      <p
                        style={{
                          margin: '2px 0 0 0',
                          fontSize: '13px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        Reason: Overlaps with existing block{' '}
                        <em>"{log.conflictingEvent}"</em>.
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleOverlaps;
