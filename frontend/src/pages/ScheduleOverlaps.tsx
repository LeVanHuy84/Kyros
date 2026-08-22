import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import apiClient from '../services/api-client';
import { useWorkspace } from '../hooks/useWorkspace';
import { useAuth } from '../hooks/useAuth';

// Import subcomponents
import type { CalendarEvent } from '../components/calendar/types';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { EventDetailsDrawer } from '../components/calendar/EventDetailsDrawer';
import { EventEditorModal } from '../components/calendar/EventEditorModal';
import { ReminderToasts } from '../components/calendar/ReminderToasts';
import { ConfirmDialog } from '../components/calendar/ConfirmDialog';

export const ScheduleOverlaps: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();

  // Calendar view states
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Selected event & Drawer states
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Modal / Editor states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [prefilledStart, setPrefilledStart] = useState<Date | null>(null);
  const [deleteConfirmEventId, setDeleteConfirmEventId] = useState<
    string | null
  >(null);

  // Active Reminder Toast Alert State
  const [activeReminders, setActiveReminders] = useState<
    {
      eventId: string;
      eventTitle: string;
      reminderId: string;
      leadTime: number;
    }[]
  >([]);

  // Fetch events for current view
  const fetchEvents = useCallback(async () => {
    if (!activeWorkspace) return [];
    setIsLoading(true);
    setErrorMsg('');

    try {
      const start = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );
      const end = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 2,
        0
      );

      const response = await apiClient.get(
        `/v1/workspaces/${activeWorkspace.id}/calendar/events`,
        {
          params: {
            startTime: start.toISOString(),
            endTime: end.toISOString(),
          },
        }
      );

      const activeEvents = (response.data || []).filter(
        (e: CalendarEvent) => e.status !== 'Deleted'
      );
      setEvents(activeEvents);
      return activeEvents;
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.friendlyMessage || 'Failed to fetch calendar events.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Periodic polling for active triggered reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date().getTime();
      const triggeredList: typeof activeReminders = [];

      events.forEach((event) => {
        event.reminders.forEach((reminder) => {
          if (reminder.status === 'Scheduled') {
            const triggerTime = new Date(reminder.triggerTime).getTime();
            if (triggerTime <= now) {
              triggeredList.push({
                eventId: event.eventId,
                eventTitle: event.title,
                reminderId: reminder.reminderId,
                leadTime: reminder.leadTimeMinutes,
              });
            }
          }
        });
      });

      if (triggeredList.length > 0) {
        setActiveReminders((prev) => {
          const ids = prev.map((r) => r.reminderId);
          const newAlerts = triggeredList.filter(
            (r) => !ids.includes(r.reminderId)
          );
          return [...prev, ...newAlerts];
        });
      }
    };

    const interval = setInterval(checkReminders, 5000);
    return () => clearInterval(interval);
  }, [events]);

  // Check event overlaps locally for UI highlighting
  const checkConflicts = useCallback(
    (event: CalendarEvent) => {
      const start = new Date(event.startTime).getTime();
      const end = new Date(event.endTime).getTime();

      return events.filter((e) => {
        if (e.eventId === event.eventId) return false;
        const eStart = new Date(e.startTime).getTime();
        const eEnd = new Date(e.endTime).getTime();
        return start < eEnd && eStart < end;
      });
    },
    [events]
  );

  // Navigate calendar dates
  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'month') {
      nextDate.setMonth(currentDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      nextDate.setDate(currentDate.getDate() - 7);
    } else {
      nextDate.setDate(currentDate.getDate() - 1);
    }
    setCurrentDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'month') {
      nextDate.setMonth(currentDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      nextDate.setDate(currentDate.getDate() + 7);
    } else {
      nextDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(nextDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open creation modal
  const openCreateModal = (prefilledDate?: Date) => {
    setIsEditing(false);
    setPrefilledStart(prefilledDate || null);
    setIsModalOpen(true);
  };

  // Open editor modal filled with existing data
  const openEditModal = (_event: CalendarEvent) => {
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Save new / edited event details
  const handleSaveEvent = async (
    title: string,
    desc: string,
    taskId: string,
    start: string,
    end: string,
    reminders: number[]
  ) => {
    if (!activeWorkspace) return;

    const startInstant = new Date(start).toISOString();
    const endInstant = new Date(end).toISOString();

    if (isEditing && selectedEvent) {
      // Edit title & description metadata
      await apiClient.patch(
        `/v1/workspaces/${activeWorkspace.id}/calendar/events/${selectedEvent.eventId}`,
        { title, description: desc }
      );

      // Also check if time range has changed. If so, reschedule.
      if (
        new Date(selectedEvent.startTime).getTime() !==
          new Date(start).getTime() ||
        new Date(selectedEvent.endTime).getTime() !== new Date(end).getTime()
      ) {
        await apiClient.post(
          `/v1/workspaces/${activeWorkspace.id}/calendar/events/${selectedEvent.eventId}/reschedule`,
          { startTime: startInstant, endTime: endInstant }
        );
      }
    } else {
      // Create new calendar event
      await apiClient.post(
        `/v1/workspaces/${activeWorkspace.id}/calendar/events`,
        {
          userId: user?.id || '00000000-0000-0000-0000-000000000000',
          taskId: taskId || null,
          title,
          description: desc,
          startTime: startInstant,
          endTime: endInstant,
          reminderOffsetsMinutes: reminders,
        }
      );
    }

    setIsModalOpen(false);
    const updatedEvents = await fetchEvents();
    if (isEditing && selectedEvent) {
      const updated = updatedEvents.find(
        (e: CalendarEvent) => e.eventId === selectedEvent.eventId
      );
      if (updated) setSelectedEvent(updated);
    }
  };

  // Delete event
  const handleDeleteEvent = (eventId: string) => {
    setDeleteConfirmEventId(eventId);
  };

  const executeDeleteEvent = async () => {
    if (!activeWorkspace || !deleteConfirmEventId) return;

    try {
      await apiClient.delete(
        `/v1/workspaces/${activeWorkspace.id}/calendar/events/${deleteConfirmEventId}`
      );
      setIsDrawerOpen(false);
      setSelectedEvent(null);
      setDeleteConfirmEventId(null);
      fetchEvents();
    } catch (err: any) {
      alert(err.friendlyMessage || 'Failed to delete event.');
    }
  };

  // Reschedule time inside Drawer
  const handleReschedule = async (
    eventId: string,
    start: string,
    end: string
  ) => {
    if (!activeWorkspace) return;
    await apiClient.post(
      `/v1/workspaces/${activeWorkspace.id}/calendar/events/${eventId}/reschedule`,
      {
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
      }
    );
    const updatedEvents = await fetchEvents();
    const updated = updatedEvents.find(
      (e: CalendarEvent) => e.eventId === eventId
    );
    if (updated) setSelectedEvent(updated);
  };

  // Add a reminder offset in details drawer
  const handleAddReminder = async (offsetMinutes: number) => {
    if (!activeWorkspace || !selectedEvent) return;
    await apiClient.post(
      `/v1/workspaces/${activeWorkspace.id}/calendar/events/${selectedEvent.eventId}/reminders`,
      null,
      {
        params: { leadTimeMinutes: offsetMinutes },
      }
    );
    const updatedEvents = await fetchEvents();
    const updated = updatedEvents.find(
      (e: CalendarEvent) => e.eventId === selectedEvent.eventId
    );
    if (updated) setSelectedEvent(updated);
  };

  // Remove a reminder in details drawer
  const handleRemoveReminder = async (reminderId: string) => {
    if (!activeWorkspace || !selectedEvent) return;
    await apiClient.delete(
      `/v1/workspaces/${activeWorkspace.id}/calendar/events/${selectedEvent.eventId}/reminders/${reminderId}`
    );
    const updatedEvents = await fetchEvents();
    const updated = updatedEvents.find(
      (e: CalendarEvent) => e.eventId === selectedEvent.eventId
    );
    if (updated) setSelectedEvent(updated);
  };

  // Snooze active reminder from Toast
  const handleSnoozeReminder = async (
    eventId: string,
    reminderId: string,
    minutes: number
  ) => {
    if (!activeWorkspace) return;
    await apiClient.post(
      `/v1/workspaces/${activeWorkspace.id}/calendar/events/${eventId}/reminders/${reminderId}/snooze`,
      null,
      {
        params: { snoozeMinutes: minutes },
      }
    );
    setActiveReminders((prev) =>
      prev.filter((r) => r.reminderId !== reminderId)
    );
    fetchEvents();
  };

  // Dismiss active reminder from Toast
  const handleDismissReminder = async (eventId: string, reminderId: string) => {
    if (!activeWorkspace) return;
    await apiClient.post(
      `/v1/workspaces/${activeWorkspace.id}/calendar/events/${eventId}/reminders/${reminderId}/dismiss`
    );
    setActiveReminders((prev) =>
      prev.filter((r) => r.reminderId !== reminderId)
    );
    fetchEvents();
  };

  // Open Drawer with detailed view
  const openEventDrawer = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDrawerOpen(true);
  };

  const formatDateLabel = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    } else if (viewMode === 'week') {
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
      const days = getWeekDays(currentDate);
      const start = days[0].toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const end = days[6].toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return `${start} - ${end}`;
    } else {
      return currentDate.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        position: 'relative',
      }}
    >
      {/* Toast Reminder Notifications */}
      <ReminderToasts
        activeReminders={activeReminders}
        onSnooze={handleSnoozeReminder}
        onDismiss={handleDismissReminder}
      />

      {/* Main Calendar Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              backgroundColor:
                'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarIcon size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h2
              style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: '700',
                margin: 0,
              }}
            >
              Schedule & Planning Board
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--text-muted)',
              }}
            >
              Manage appointments, tasks, and system blocks within workspace
              boundaries.
            </p>
          </div>
        </div>

        <button onClick={() => openCreateModal()} className="btn btn-primary">
          <Plus size={18} />
          <span>New Event</span>
        </button>
      </div>

      {/* Navigation and View Selectors toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleToday}
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Today
          </button>
          <div
            style={{
              display: 'flex',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={handlePrev}
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                cursor: 'pointer',
              }}
              aria-label="Previous date range"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderLeft: 'none',
                color: 'var(--text-main)',
                cursor: 'pointer',
              }}
              aria-label="Next date range"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <span
            style={{
              fontSize: '18px',
              fontWeight: '700',
              marginLeft: '12px',
              color: 'var(--text-main)',
            }}
          >
            {formatDateLabel()}
          </span>
        </div>

        {/* View mode switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
          }}
        >
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: '6px 14px',
                textTransform: 'capitalize',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: viewMode === mode ? '600' : '500',
                backgroundColor:
                  viewMode === mode ? 'var(--bg-card)' : 'transparent',
                color:
                  viewMode === mode
                    ? 'var(--color-primary)'
                    : 'var(--text-muted)',
                boxShadow: viewMode === mode ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid var(--color-danger)',
            color: 'var(--color-danger)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Calendar Grid */}
      <CalendarGrid
        currentDate={currentDate}
        viewMode={viewMode}
        events={events}
        isLoading={isLoading}
        onCellClick={openCreateModal}
        onEventClick={openEventDrawer}
        checkConflicts={checkConflicts}
      />

      {/* Right Details Drawer */}
      <EventDetailsDrawer
        selectedEvent={selectedEvent}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onDelete={handleDeleteEvent}
        onReschedule={handleReschedule}
        onAddReminder={handleAddReminder}
        onRemoveReminder={handleRemoveReminder}
        onEditClick={openEditModal}
        conflictingEvents={selectedEvent ? checkConflicts(selectedEvent) : []}
      />

      {/* Event Editor Modal */}
      <EventEditorModal
        isOpen={isModalOpen}
        isEditing={isEditing}
        selectedEvent={selectedEvent}
        prefilledStart={prefilledStart}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
      />

      {/* Custom event cancel confirmation modal */}
      <ConfirmDialog
        isOpen={deleteConfirmEventId !== null}
        title="Cancel Calendar Event"
        message="Are you sure you want to cancel this calendar event? This action cannot be undone."
        confirmText="Cancel Event"
        cancelText="Keep Event"
        isDanger={true}
        onConfirm={executeDeleteEvent}
        onCancel={() => setDeleteConfirmEventId(null)}
      />
    </div>
  );
};

export default ScheduleOverlaps;
