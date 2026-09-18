import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Clock,
  ChevronRight,
  X,
  Calendar as CalendarIcon,
} from 'lucide-react';
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

// Category helper for subtle color accents
const getCategoryStyle = (event: CalendarEvent, hasConflict: boolean) => {
  if (hasConflict) {
    return {
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.4)',
      text: '#ef4444',
      dotColor: '#ef4444',
      badgeBg: 'rgba(239, 68, 68, 0.2)',
      categoryName: 'Conflict',
    };
  }

  const titleLower = (event.title || '').toLowerCase();

  if (
    titleLower.includes('meeting') ||
    titleLower.includes('họp') ||
    titleLower.includes('call')
  ) {
    return {
      bg: 'rgba(59, 130, 246, 0.12)',
      border: 'rgba(59, 130, 246, 0.3)',
      text: '#60a5fa',
      dotColor: '#3b82f6',
      badgeBg: 'rgba(59, 130, 246, 0.2)',
      categoryName: 'Meeting',
    };
  }
  if (
    titleLower.includes('task') ||
    titleLower.includes('viết') ||
    titleLower.includes('làm') ||
    event.taskId
  ) {
    return {
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.3)',
      text: '#34d399',
      dotColor: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.2)',
      categoryName: 'Task',
    };
  }
  if (
    titleLower.includes('speaking') ||
    titleLower.includes('listening') ||
    titleLower.includes('reading') ||
    titleLower.includes('học')
  ) {
    return {
      bg: 'rgba(168, 85, 247, 0.12)',
      border: 'rgba(168, 85, 247, 0.3)',
      text: '#c084fc',
      dotColor: '#a855f7',
      badgeBg: 'rgba(168, 85, 247, 0.2)',
      categoryName: 'Study',
    };
  }

  // Default Primary Theme
  return {
    bg: 'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.12)',
    border:
      'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.25)',
    text: 'var(--text-main)',
    dotColor: 'var(--color-primary)',
    badgeBg:
      'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.18)',
    categoryName: 'Event',
  };
};

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  viewMode,
  events,
  isLoading,
  onCellClick,
  onEventClick,
  checkConflicts,
}) => {
  // Popover modal state for "+N more" day details
  const [dayPopoverData, setDayPopoverData] = useState<{
    date: Date;
    events: CalendarEvent[];
  } | null>(null);

  // Tooltip state for hovered event
  const [hoveredEvent, setHoveredEvent] = useState<{
    event: CalendarEvent;
    rect: DOMRect;
  } | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];
    // Convert Sunday = 0 to 6th index for Mon-Sun grid
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < offset; i++) {
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

    const weekDays: Date[] = [];
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

  const MAX_VISIBLE_EVENTS = 3;

  return (
    <div
      className="calendar-shell"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        minHeight: '520px',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
      }}
    >
      {/* ----------------- MONTH VIEW ----------------- */}
      {viewMode === 'month' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Header Row */}
          <div
            className="calendar-month-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              textAlign: 'center',
              fontWeight: '600',
              fontSize: '12px',
              color: 'var(--text-muted)',
              padding: '10px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
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

          {/* Grid Cells */}
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
                      opacity: 0.3,
                      minHeight: '125px',
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

              // Sort events by startTime ASC
              dayEvents.sort(
                (a, b) =>
                  new Date(a.startTime).getTime() -
                  new Date(b.startTime).getTime()
              );

              const isToday = new Date().toDateString() === day.toDateString();
              const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
              const hiddenCount = dayEvents.length - MAX_VISIBLE_EVENTS;

              return (
                <div
                  key={`day-${day.getTime()}`}
                  onClick={() => onCellClick(day)}
                  style={{
                    backgroundColor: isToday
                      ? 'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.04)'
                      : 'var(--bg-card)',
                    height: '125px',
                    maxHeight: '125px',
                    padding: '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'background var(--transition-fast)',
                    boxSizing: 'border-box',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isToday
                      ? 'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.08)'
                      : 'var(--bg-app)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isToday
                      ? 'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.04)'
                      : 'var(--bg-card)';
                  }}
                >
                  {/* Top Bar: Date Number + Event Count Pill */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: isToday ? '800' : '600',
                        color: isToday
                          ? 'var(--color-primary)'
                          : 'var(--text-muted)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: isToday
                          ? 'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.15)'
                          : 'transparent',
                        lineHeight: '1.2',
                      }}
                    >
                      {day.getDate()}
                    </span>

                    {dayEvents.length > 0 && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          opacity: 0.7,
                          fontWeight: '500',
                        }}
                      >
                        {dayEvents.length}{' '}
                        {dayEvents.length === 1 ? 'evt' : 'evts'}
                      </span>
                    )}
                  </div>

                  {/* Events Container */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    {visibleEvents.map((event) => {
                      const conflicts = checkConflicts(event);
                      const hasConflict = conflicts.length > 0;
                      const style = getCategoryStyle(event, hasConflict);

                      return (
                        <div
                          key={event.eventId}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                          onMouseEnter={(e) => {
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            setHoveredEvent({ event, rect });
                          }}
                          onMouseLeave={() => setHoveredEvent(null)}
                          style={{
                            backgroundColor: style.bg,
                            border: `1px solid ${style.border}`,
                            borderRadius: '4px',
                            padding: '3px 6px',
                            fontSize: '11px',
                            color: style.text,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            transition: 'all 0.15s ease',
                            lineHeight: '1.3',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: '600',
                              color: 'var(--text-muted)',
                              flexShrink: 0,
                            }}
                          >
                            {formatTimeStr(event.startTime)}
                          </span>

                          <span
                            style={{
                              fontWeight: '600',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flexGrow: 1,
                            }}
                          >
                            {event.title}
                          </span>

                          {hasConflict && (
                            <AlertTriangle
                              size={11}
                              style={{ color: '#ef4444', flexShrink: 0 }}
                            />
                          )}
                        </div>
                      );
                    })}

                    {/* "+N more" Button */}
                    {hiddenCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDayPopoverData({ date: day, events: dayEvents });
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          fontSize: '11px',
                          fontWeight: '700',
                          textAlign: 'left',
                          padding: '1px 4px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          borderRadius: '3px',
                          width: 'fit-content',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        +{hiddenCount} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- WEEK VIEW ----------------- */}
      {viewMode === 'week' && (
        <div
          className="calendar-week-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            backgroundColor: 'var(--border-color)',
            gap: '1px',
            width: '100%',
            boxSizing: 'border-box',
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
            dayEvents.sort(
              (a, b) =>
                new Date(a.startTime).getTime() -
                new Date(b.startTime).getTime()
            );

            const isToday = new Date().toDateString() === day.toDateString();

            return (
              <div
                key={`week-${day.getTime()}`}
                onClick={() => onCellClick(day)}
                style={{
                  backgroundColor: isToday
                    ? 'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.03)'
                    : 'var(--bg-card)',
                  minHeight: '420px',
                  minWidth: 0,
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '8px',
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      fontWeight: '700',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: '800',
                      color: isToday
                        ? 'var(--color-primary)'
                        : 'var(--text-main)',
                      flexShrink: 0,
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
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
                >
                  {dayEvents.map((event) => {
                    const conflicts = checkConflicts(event);
                    const hasConflict = conflicts.length > 0;
                    const style = getCategoryStyle(event, hasConflict);

                    return (
                      <div
                        key={event.eventId}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        style={{
                          backgroundColor: style.bg,
                          border: `1px solid ${style.border}`,
                          borderRadius: '6px',
                          padding: '6px 8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: style.text,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                          cursor: 'pointer',
                          width: '100%',
                          minWidth: 0,
                          boxSizing: 'border-box',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '4px',
                            minWidth: 0,
                            width: '100%',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: '700',
                              flex: 1,
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {event.title}
                          </span>
                          {hasConflict && (
                            <AlertTriangle
                              size={12}
                              style={{ color: '#ef4444', flexShrink: 0 }}
                            />
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            minWidth: 0,
                          }}
                        >
                          {formatTimeStr(event.startTime)} -{' '}
                          {formatTimeStr(event.endTime)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ----------------- DAY VIEW (AGENDA) ----------------- */}
      {viewMode === 'day' && (
        <div
          style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '12px',
              marginBottom: '16px',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '700',
                margin: 0,
                color: 'var(--text-main)',
              }}
            >
              Agenda —{' '}
              {currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </h3>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
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
                  fontSize: '14px',
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
                .sort(
                  (a, b) =>
                    new Date(a.startTime).getTime() -
                    new Date(b.startTime).getTime()
                )
                .map((event) => {
                  const conflicts = checkConflicts(event);
                  const hasConflict = conflicts.length > 0;
                  const style = getCategoryStyle(event, hasConflict);

                  return (
                    <div
                      key={event.eventId}
                      onClick={() => onEventClick(event)}
                      style={{
                        backgroundColor: 'var(--bg-app)',
                        border: `1px solid ${style.border}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 18px',
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
                          gap: '14px',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: style.dotColor,
                            flexShrink: 0,
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
                              fontSize: '15px',
                              fontWeight: '700',
                              color: 'var(--text-main)',
                            }}
                          >
                            {event.title}
                          </span>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '13px',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <Clock size={14} />
                            <span>
                              {formatTimeStr(event.startTime)} -{' '}
                              {formatTimeStr(event.endTime)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {hasConflict && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#ef4444',
                            fontSize: '13px',
                            fontWeight: '600',
                          }}
                        >
                          <AlertTriangle size={15} />
                          <span>Interval Overlap</span>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* ----------------- HOVER TOOLTIP ----------------- */}
      {hoveredEvent &&
        createPortal(
          (() => {
            const tooltipWidth = 260;
            const tooltipHeight = 120;
            const margin = 16;
            let left = hoveredEvent.rect.left;
            if (left + tooltipWidth > window.innerWidth - margin) {
              left = hoveredEvent.rect.right - tooltipWidth;
            }
            left = Math.max(
              margin,
              Math.min(left, window.innerWidth - tooltipWidth - margin)
            );

            let top = hoveredEvent.rect.bottom + 6;
            if (top + tooltipHeight > window.innerHeight - margin) {
              top = Math.max(margin, hoveredEvent.rect.top - tooltipHeight - 6);
            }

            return (
              <div
                style={{
                  position: 'fixed',
                  top: `${top}px`,
                  left: `${left}px`,
                  width: `${tooltipWidth}px`,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 10000,
                  pointerEvents: 'none',
                  animation: 'fadeIn 0.15s ease',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    marginBottom: '6px',
                  }}
                >
                  {hoveredEvent.event.title}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                  }}
                >
                  <Clock size={12} />
                  <span>
                    {formatTimeStr(hoveredEvent.event.startTime)} -{' '}
                    {formatTimeStr(hoveredEvent.event.endTime)}
                  </span>
                </div>
                {hoveredEvent.event.description && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      lineHeight: '1.4',
                      marginTop: '6px',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '6px',
                      maxHeight: '60px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {hoveredEvent.event.description}
                  </div>
                )}
              </div>
            );
          })(),
          document.body
        )}

      {/* ----------------- DAY DETAIL POPOVER / MODAL FOR "+N MORE" ----------------- */}
      {dayPopoverData &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
            onClick={() => setDayPopoverData(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: '420px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
                animation: 'scaleIn 0.15s ease',
              }}
            >
              {/* Popover Header */}
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-app)',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <CalendarIcon
                    size={16}
                    style={{ color: 'var(--color-primary)' }}
                  />
                  <span
                    style={{
                      fontWeight: '700',
                      fontSize: '15px',
                      color: 'var(--text-main)',
                    }}
                  >
                    {dayPopoverData.date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor:
                        'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.15)',
                      color: 'var(--color-primary)',
                      padding: '2px 6px',
                      borderRadius: '10px',
                    }}
                  >
                    {dayPopoverData.events.length} events
                  </span>
                </div>
                <button
                  onClick={() => setDayPopoverData(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Popover Events List */}
              <div
                style={{
                  padding: '14px 18px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {dayPopoverData.events.map((event) => {
                  const conflicts = checkConflicts(event);
                  const hasConflict = conflicts.length > 0;
                  const style = getCategoryStyle(event, hasConflict);

                  return (
                    <div
                      key={event.eventId}
                      onClick={() => {
                        setDayPopoverData(null);
                        onEventClick(event);
                      }}
                      style={{
                        backgroundColor: style.bg,
                        border: `1px solid ${style.border}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: '700',
                            fontSize: '13px',
                            color: style.text,
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
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {hasConflict && (
                          <AlertTriangle
                            size={14}
                            style={{ color: '#ef4444' }}
                          />
                        )}
                        <ChevronRight
                          size={16}
                          style={{ color: 'var(--text-muted)' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
