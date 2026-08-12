import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import type { CalendarEvent } from './types';

interface CalendarGridProps {
  currentDate: Date;
  viewMode: 'month' | 'week' | 'day';
  events: CalendarEvent[];
  isLoading: boolean;
  onCellClick: (prefilledStart: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  checkConflicts: (event: CalendarEvent) => CalendarEvent[];
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  viewMode,
  events,
  isLoading,
  onCellClick,
  onEventClick,
  checkConflicts,
}) => {
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const getWeekDays = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(new Date(monday.getTime() + i * 24 * 60 * 60 * 1000));
    }
    return weekDays;
  };

  const formatTimeStr = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  if (isLoading) {
    return (
      <div
        style={{
          padding: 'var(--space-10)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        Loading schedule timelines...
      </div>
    );
  }

  return (
    <div
      className="calendar-shell"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        minHeight: '480px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {viewMode === 'month' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            className="calendar-month-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: '13px',
              color: 'var(--text-muted)',
              padding: '10px 0',
            }}
          >
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          <div
            className="calendar-month-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              backgroundColor: 'var(--border-color)',
              gap: '1px',
            }}
          >
            {getDaysInMonth(currentDate).map((day, idx) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${idx}`}
                    style={{
                      backgroundColor: 'var(--bg-app)',
                      opacity: 0.4,
                      minHeight: '110px',
                    }}
                  />
                );
              }

              const dayEvents = events.filter((e) => {
                const evDate = new Date(e.startTime);
                return (
                  evDate.getDate() === day.getDate() &&
                  evDate.getMonth() === day.getMonth() &&
                  evDate.getFullYear() === day.getFullYear()
                );
              });

              const isToday = new Date().toDateString() === day.toDateString();

              return (
                <div
                  key={`day-${day.getTime()}`}
                  onClick={() => onCellClick(day)}
                  style={{
                    backgroundColor: isToday
                      ? 'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.02)'
                      : 'var(--bg-card)',
                    minHeight: '110px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-app)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isToday
                      ? 'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.02)'
                      : 'var(--bg-card)';
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: isToday
                        ? 'var(--color-primary)'
                        : 'var(--text-muted)',
                      alignSelf: 'flex-start',
                      padding: '4px',
                      borderRadius: '4px',
                      backgroundColor: isToday
                        ? 'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.1)'
                        : 'transparent',
                    }}
                  >
                    {day.getDate()}
                  </span>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      flexGrow: 1,
                    }}
                  >
                    {dayEvents.map((event) => {
                      const conflicts = checkConflicts(event);
                      const hasConflict = conflicts.length > 0;

                      return (
                        <div
                          key={event.eventId}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          style={{
                            backgroundColor: hasConflict
                              ? 'rgba(239, 68, 68, 0.06)'
                              : 'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.06)',
                            border: `1px solid ${hasConflict ? 'var(--color-danger)' : 'var(--border-color)'}`,
                            borderRadius: 'var(--radius-sm)',
                            padding: '5px 8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: hasConflict
                              ? 'var(--color-danger)'
                              : 'var(--text-main)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            transition: 'transform var(--transition-fast)',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.transform = 'scale(1.02)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.transform = 'scale(1)')
                          }
                        >
                          <span
                            style={{
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {event.title}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {formatTimeStr(event.startTime)}
                          </span>
                          {hasConflict && (
                            <span
                              style={{
                                fontSize: '10px',
                                color: 'var(--color-danger)',
                                fontWeight: '700',
                              }}
                            >
                              ! Conflict
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div
          className="calendar-week-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            backgroundColor: 'var(--border-color)',
            gap: '1px',
          }}
        >
          {getWeekDays(currentDate).map((day) => {
            const dayEvents = events.filter((e) => {
              const evDate = new Date(e.startTime);
              return (
                evDate.getDate() === day.getDate() &&
                evDate.getMonth() === day.getMonth() &&
                evDate.getFullYear() === day.getFullYear()
              );
            });
            const isToday = new Date().toDateString() === day.toDateString();

            return (
              <div
                key={`week-${day.getTime()}`}
                onClick={() => onCellClick(day)}
                style={{
                  backgroundColor: isToday
                    ? 'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.02)'
                    : 'var(--bg-card)',
                  minHeight: '380px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      fontWeight: '600',
                    }}
                  >
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span
                    style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      color: isToday
                        ? 'var(--color-primary)'
                        : 'var(--text-main)',
                    }}
                  >
                    {day.getDate()}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    flexGrow: 1,
                  }}
                >
                  {dayEvents.map((event) => {
                    const conflicts = checkConflicts(event);
                    const hasConflict = conflicts.length > 0;

                    return (
                      <div
                        key={event.eventId}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        style={{
                          backgroundColor: hasConflict
                            ? 'rgba(239, 68, 68, 0.08)'
                            : 'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.06)',
                          border: `1px solid ${hasConflict ? 'var(--color-danger)' : 'var(--border-color)'}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 10px',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: hasConflict
                            ? 'var(--color-danger)'
                            : 'var(--text-main)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: '700',
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {event.title}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {formatTimeStr(event.startTime)} -{' '}
                          {formatTimeStr(event.endTime)}
                        </span>
                        {hasConflict && (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              color: 'var(--color-danger)',
                              fontWeight: '700',
                            }}
                          >
                            <AlertTriangle size={12} /> Conflict Overlap
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'day' && (
        <div
          style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '700',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '12px',
              margin: '0 0 16px 0',
            }}
          >
            Daily Schedule (Agenda)
          </h3>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {events.filter((e) => {
              const evDate = new Date(e.startTime);
              return (
                evDate.getDate() === currentDate.getDate() &&
                evDate.getMonth() === currentDate.getMonth() &&
                evDate.getFullYear() === currentDate.getFullYear()
              );
            }).length === 0 ? (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '15px',
                }}
              >
                No commitments scheduled for this day. Click "+ New Event" to
                schedule.
              </div>
            ) : (
              events
                .filter((e) => {
                  const evDate = new Date(e.startTime);
                  return (
                    evDate.getDate() === currentDate.getDate() &&
                    evDate.getMonth() === currentDate.getMonth() &&
                    evDate.getFullYear() === currentDate.getFullYear()
                  );
                })
                .map((event) => {
                  const conflicts = checkConflicts(event);
                  const hasConflict = conflicts.length > 0;

                  return (
                    <div
                      key={event.eventId}
                      onClick={() => onEventClick(event)}
                      style={{
                        backgroundColor: 'var(--bg-app)',
                        border: `1px solid ${hasConflict ? 'var(--color-danger)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'border-color var(--transition-fast)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: '16px',
                          alignItems: 'center',
                        }}
                      >
                        <Clock
                          size={20}
                          style={{
                            color: hasConflict
                              ? 'var(--color-danger)'
                              : 'var(--color-primary)',
                          }}
                        />
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '16px',
                              fontWeight: '700',
                              color: 'var(--text-main)',
                            }}
                          >
                            {event.title}
                          </span>
                          <span
                            style={{
                              fontSize: '14px',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {formatTimeStr(event.startTime)} -{' '}
                            {formatTimeStr(event.endTime)}
                          </span>
                        </div>
                      </div>

                      {hasConflict && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'var(--color-danger)',
                            fontSize: '14px',
                            fontWeight: '600',
                          }}
                        >
                          <AlertTriangle size={16} />
                          <span>Interval Overlap Detected</span>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
