export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

export type ReminderStatus = 'PENDING' | 'TRIGGERED' | 'SNOOZED' | 'DISMISSED';

export interface EventReminder {
  id: string;
  leadTimeMinutes: number;
  triggerTime: string;
  status: ReminderStatus;
}

export interface CalendarEvent {
  id: string;
  workspaceId: string;
  userId: string;
  taskId?: string | null;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: string; // ISO 8601 UTC
  endTime: string;   // ISO 8601 UTC
  isAllDay: boolean;
  category?: string;
  color?: string;
  attendees?: string[];
  reminders: EventReminder[];
  status: string;
  createdAt?: string;
  updatedAt?: string;
  version: number;
}

export interface CreateCalendarEventDto {
  title: string;
  description?: string;
  taskId?: string | null;
  startTime: string; // ISO 8601 UTC
  endTime: string;   // ISO 8601 UTC
  reminderOffsetsMinutes?: number[];
  category?: string;
  color?: string;
  isAllDay?: boolean;
}

export interface RescheduleEventDto {
  startTime: string; // ISO 8601 UTC
  endTime: string;   // ISO 8601 UTC
}

export interface TimeSlot {
  startTime: string; // ISO 8601 UTC
  endTime: string;   // ISO 8601 UTC
  durationMinutes: number;
}

export interface AvailabilityWindow {
  start: string;
  end: string;
  isAvailable: boolean;
}

export interface EventConflict {
  eventA: CalendarEvent;
  eventB: CalendarEvent;
  overlapStart: string;
  overlapEnd: string;
  suggestedResolution?: 'shift_later' | 'shorten' | 'auto';
}

export interface CalendarFilterState {
  viewMode: CalendarViewMode;
  selectedDate: Date;
  category: string | null;
  search: string;
}
