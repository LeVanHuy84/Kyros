import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { WorkspaceService } from '@core/workspace/services/workspace.service';
import { AuthService } from '@core/auth/services/auth.service';
import {
  AvailabilityWindow,
  CalendarEvent,
  CalendarViewMode,
  CreateCalendarEventDto,
  EventConflict,
  EventReminder,
  RescheduleEventDto,
  TimeSlot,
} from '../models/calendar.models';

interface RawReminderDto {
  reminderId: string;
  leadTimeMinutes: number;
  triggerTime: string;
  status: string;
}

interface RawCalendarEventDto {
  eventId: string;
  workspaceId: string;
  userId: string;
  taskId?: string | null;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  status: string;
  reminders?: RawReminderDto[];
  createdAt?: string;
  updatedAt?: string;
  version: number;
}

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private readonly http = inject(HttpClient);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly authService = inject(AuthService);

  readonly events = signal<CalendarEvent[]>([]);
  readonly selectedDate = signal<Date>(new Date());
  readonly viewMode = signal<CalendarViewMode>('month');
  readonly isLoading = signal<boolean>(false);
  readonly isActionLoading = signal<boolean>(false);
  readonly searchQuery = signal<string>('');

  private get wsId(): string {
    return this.workspaceService.activeWorkspaceId() || '';
  }

  private get userId(): string {
    return this.authService.currentUser()?.id || '00000000-0000-0000-0000-000000000000';
  }

  /**
   * Calculates the start and end dates for the current view and selected date.
   */
  readonly activeRange = computed<{ start: Date; end: Date }>(() => {
    const d = new Date(this.selectedDate());
    const mode = this.viewMode();

    if (mode === 'day') {
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      return { start, end };
    }

    if (mode === 'week') {
      // Find Monday of the current week (ISO week)
      const dayOfWeek = (d.getDay() + 6) % 7; // Monday = 0, Sunday = 6
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dayOfWeek, 0, 0, 0, 0);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999);
      return { start, end };
    }

    if (mode === 'agenda') {
      // Selected day + 30 days ahead
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 30, 23, 59, 59, 999);
      return { start, end };
    }

    // Default: Month view (includes padding days from prev/next months)
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOffset = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0

    const start = new Date(year, month, 1 - firstDayOffset, 0, 0, 0, 0);
    // 42 days grid total (6 weeks x 7 days)
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 41, 23, 59, 59, 999);
    return { start, end };
  });

  /**
   * Filtered events based on search query.
   */
  readonly filteredEvents = computed<CalendarEvent[]>(() => {
    const list = this.events();
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return list;

    return list.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        (e.description && e.description.toLowerCase().includes(query)) ||
        (e.location && e.location.toLowerCase().includes(query))
    );
  });

  /**
   * Detect all overlapping event pairs (Conflicts).
   */
  readonly conflicts = computed<EventConflict[]>(() => {
    const list = [...this.events()].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    const conflictsList: EventConflict[] = [];

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const aStart = new Date(a.startTime).getTime();
        const aEnd = new Date(a.endTime).getTime();
        const bStart = new Date(b.startTime).getTime();
        const bEnd = new Date(b.endTime).getTime();

        // Conflict check: aStart < bEnd and aEnd > bStart
        if (aStart < bEnd && aEnd > bStart) {
          const overlapStart = new Date(Math.max(aStart, bStart)).toISOString();
          const overlapEnd = new Date(Math.min(aEnd, bEnd)).toISOString();
          conflictsList.push({
            eventA: a,
            eventB: b,
            overlapStart,
            overlapEnd,
            suggestedResolution: 'shift_later',
          });
        }
      }
    }
    return conflictsList;
  });

  /**
   * Set of event IDs that are in conflict.
   */
  readonly conflictingEventIds = computed<Set<string>>(() => {
    const set = new Set<string>();
    for (const conflict of this.conflicts()) {
      set.add(conflict.eventA.id);
      set.add(conflict.eventB.id);
    }
    return set;
  });

  /**
   * Has any conflicts in active schedule.
   */
  readonly hasConflicts = computed<boolean>(() => this.conflicts().length > 0);

  /**
   * Reminders needing user attention (pending/triggered).
   */
  readonly activeTriggeredReminders = computed<
    { event: CalendarEvent; reminder: EventReminder }[]
  >(() => {
    const list = this.events();
    const result: { event: CalendarEvent; reminder: EventReminder }[] = [];
    const now = Date.now();

    for (const ev of list) {
      for (const rem of ev.reminders) {
        if (rem.status === 'PENDING' || rem.status === 'TRIGGERED') {
          const triggerMs = new Date(rem.triggerTime).getTime();
          // Trigger within 5 mins or already past trigger time
          if (triggerMs <= now + 300_000) {
            result.push({ event: ev, reminder: rem });
          }
        }
      }
    }
    return result;
  });

  /**
   * Loads events for the active date range.
   */
  loadEvents(rangeStart?: Date, rangeEnd?: Date): Observable<CalendarEvent[]> {
    const wsId = this.wsId;
    if (!wsId) return of([]);

    const range = this.activeRange();
    const start = (rangeStart || range.start).toISOString();
    const end = (rangeEnd || range.end).toISOString();

    this.isLoading.set(true);
    const params = new HttpParams().set('startTime', start).set('endTime', end);

    return this.http
      .get<RawCalendarEventDto[]>(`/api/v1/workspaces/${wsId}/calendar/events`, { params })
      .pipe(
        map((rawList) => {
          const mapped = (rawList || [])
            .filter((r) => r.status !== 'Deleted' && r.status !== 'DELETED')
            .map((r) => this.mapRawEvent(r));
          this.events.set(mapped);
          this.isLoading.set(false);
          return mapped;
        }),
        catchError((err) => {
          this.isLoading.set(false);
          return of([]);
        })
      );
  }

  /**
   * Creates a new calendar event.
   */
  createEvent(dto: CreateCalendarEventDto): Observable<CalendarEvent | null> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    this.isActionLoading.set(true);
    const payload = {
      userId: this.userId,
      taskId: dto.taskId || null,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      startTime: dto.startTime,
      endTime: dto.endTime,
      reminderOffsetsMinutes: dto.reminderOffsetsMinutes || [15],
    };

    return this.http
      .post<RawCalendarEventDto>(`/api/v1/workspaces/${wsId}/calendar/events`, payload)
      .pipe(
        tap(() => {
          this.isActionLoading.set(false);
          this.loadEvents().subscribe();
        }),
        map((res) => (res ? this.mapRawEvent(res) : null)),
        catchError((err) => {
          this.isActionLoading.set(false);
          return throwError(() => err);
        })
      );
  }

  /**
   * Updates event title and description metadata.
   */
  updateEventMetadata(
    eventId: string,
    title: string,
    description?: string | null
  ): Observable<void> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    this.isActionLoading.set(true);
    const payload = {
      title: title.trim(),
      description: description?.trim() || '',
    };

    return this.http
      .patch<void>(`/api/v1/workspaces/${wsId}/calendar/events/${eventId}`, payload)
      .pipe(
        tap(() => {
          this.isActionLoading.set(false);
          this.events.update((list) =>
            list.map((e) =>
              e.id === eventId
                ? { ...e, title: payload.title, description: payload.description }
                : e
            )
          );
        }),
        catchError((err) => {
          this.isActionLoading.set(false);
          return throwError(() => err);
        })
      );
  }

  /**
   * Reschedules an event to a new start and end time.
   */
  rescheduleEvent(
    eventId: string,
    startTime: string,
    endTime: string
  ): Observable<void> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    this.isActionLoading.set(true);
    const payload = { startTime, endTime };

    return this.http
      .post<void>(`/api/v1/workspaces/${wsId}/calendar/events/${eventId}/reschedule`, payload)
      .pipe(
        tap(() => {
          this.isActionLoading.set(false);
          this.events.update((list) =>
            list.map((e) =>
              e.id === eventId ? { ...e, startTime, endTime } : e
            )
          );
          this.loadEvents().subscribe();
        }),
        catchError((err) => {
          this.isActionLoading.set(false);
          return throwError(() => err);
        })
      );
  }

  /**
   * Deletes a calendar event.
   */
  deleteEvent(eventId: string): Observable<void> {
    const wsId = this.wsId;
    if (!wsId) return of(undefined);

    this.isActionLoading.set(true);
    // Optimistic delete
    this.events.update((list) => list.filter((e) => e.id !== eventId));

    return this.http
      .delete<void>(`/api/v1/workspaces/${wsId}/calendar/events/${eventId}`)
      .pipe(
        tap(() => {
          this.isActionLoading.set(false);
        }),
        catchError((err) => {
          this.isActionLoading.set(false);
          this.loadEvents().subscribe();
          return throwError(() => err);
        })
      );
  }

  /**
   * Adds a reminder to an event.
   */
  addReminder(eventId: string, leadTimeMinutes: number): Observable<void> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    return this.http
      .post<void>(
        `/api/v1/workspaces/${wsId}/calendar/events/${eventId}/reminders`,
        null,
        { params: { leadTimeMinutes: leadTimeMinutes.toString() } }
      )
      .pipe(
        tap(() => {
          this.loadEvents().subscribe();
        })
      );
  }

  /**
   * Removes a reminder from an event.
   */
  removeReminder(eventId: string, reminderId: string): Observable<void> {
    const wsId = this.wsId;
    if (!wsId) return of(undefined);

    return this.http
      .delete<void>(
        `/api/v1/workspaces/${wsId}/calendar/events/${eventId}/reminders/${reminderId}`
      )
      .pipe(
        tap(() => {
          this.events.update((list) =>
            list.map((e) => {
              if (e.id === eventId) {
                return {
                  ...e,
                  reminders: e.reminders.filter((r) => r.id !== reminderId),
                };
              }
              return e;
            })
          );
        })
      );
  }

  /**
   * Snoozes a reminder for X minutes.
   */
  snoozeReminder(
    eventId: string,
    reminderId: string,
    snoozeMinutes: number = 5
  ): Observable<void> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    return this.http
      .post<void>(
        `/api/v1/workspaces/${wsId}/calendar/events/${eventId}/reminders/${reminderId}/snooze`,
        null,
        { params: { snoozeMinutes: snoozeMinutes.toString() } }
      )
      .pipe(
        tap(() => {
          this.loadEvents().subscribe();
        })
      );
  }

  /**
   * Dismisses a reminder.
   */
  dismissReminder(eventId: string, reminderId: string): Observable<void> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    return this.http
      .post<void>(
        `/api/v1/workspaces/${wsId}/calendar/events/${eventId}/reminders/${reminderId}/dismiss`,
        null
      )
      .pipe(
        tap(() => {
          this.events.update((list) =>
            list.map((e) => {
              if (e.id === eventId) {
                return {
                  ...e,
                  reminders: e.reminders.map((r) =>
                    r.id === reminderId ? { ...r, status: 'DISMISSED' as const } : r
                  ),
                };
              }
              return e;
            })
          );
        })
      );
  }

  /**
   * Queries free/busy availability windows.
   */
  queryAvailability(
    rangeStart: Date,
    rangeEnd: Date,
    workingHoursStart: string = '09:00',
    workingHoursEnd: string = '17:00',
    minimumNoticeMinutes: number = 0
  ): Observable<AvailabilityWindow[]> {
    const wsId = this.wsId;
    if (!wsId) return of([]);

    let params = new HttpParams()
      .set('rangeStart', rangeStart.toISOString())
      .set('rangeEnd', rangeEnd.toISOString())
      .set('workingHoursStart', workingHoursStart)
      .set('workingHoursEnd', workingHoursEnd)
      .set('minimumNoticeMinutes', minimumNoticeMinutes.toString());

    return this.http.get<AvailabilityWindow[]>(
      `/api/v1/workspaces/${wsId}/calendar/events/availability`,
      { params }
    );
  }

  /**
   * Discovers available time slots for a task of given duration.
   */
  discoverSlots(
    rangeStart: Date,
    rangeEnd: Date,
    desiredDurationMinutes: number = 30,
    workingHoursStart: string = '09:00',
    workingHoursEnd: string = '17:00',
    maxResults: number = 10
  ): Observable<TimeSlot[]> {
    const wsId = this.wsId;
    if (!wsId) return of([]);

    let params = new HttpParams()
      .set('rangeStart', rangeStart.toISOString())
      .set('rangeEnd', rangeEnd.toISOString())
      .set('desiredDurationMinutes', desiredDurationMinutes.toString())
      .set('workingHoursStart', workingHoursStart)
      .set('workingHoursEnd', workingHoursEnd)
      .set('maxResults', maxResults.toString());

    return this.http.get<TimeSlot[]>(
      `/api/v1/workspaces/${wsId}/calendar/events/availability/slots`,
      { params }
    );
  }

  /**
   * Triggers AI auto-scheduling for unscheduled tasks.
   */
  autoScheduleTasks(daysAhead: number = 7): Observable<CalendarEvent[]> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    this.isActionLoading.set(true);
    const params = new HttpParams().set('daysAhead', daysAhead.toString());

    return this.http
      .post<RawCalendarEventDto[]>(
        `/api/v1/workspaces/${wsId}/calendar/events/auto-schedule`,
        null,
        { params }
      )
      .pipe(
        map((res) => {
          this.isActionLoading.set(false);
          const mapped = (res || []).map((r) => this.mapRawEvent(r));
          this.loadEvents().subscribe();
          return mapped;
        }),
        catchError((err) => {
          this.isActionLoading.set(false);
          return throwError(() => err);
        })
      );
  }

  /**
   * Triggers 1-click AI conflict resolution.
   */
  resolveConflicts(daysAhead: number = 7): Observable<CalendarEvent[]> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    this.isActionLoading.set(true);
    const params = new HttpParams().set('daysAhead', daysAhead.toString());

    return this.http
      .post<RawCalendarEventDto[]>(
        `/api/v1/workspaces/${wsId}/calendar/events/resolve-conflicts`,
        null,
        { params }
      )
      .pipe(
        map((res) => {
          this.isActionLoading.set(false);
          const mapped = (res || []).map((r) => this.mapRawEvent(r));
          this.loadEvents().subscribe();
          return mapped;
        }),
        catchError((err) => {
          this.isActionLoading.set(false);
          return throwError(() => err);
        })
      );
  }

  // Navigation helpers
  nextPeriod(): void {
    let d = new Date(this.selectedDate());
    const mode = this.viewMode();

    if (mode === 'month') {
      const year = d.getFullYear();
      const month = d.getMonth();
      const today = new Date();
      const targetDate = new Date(year, month + 1, 1);
      if (
        today.getFullYear() === targetDate.getFullYear() &&
        today.getMonth() === targetDate.getMonth()
      ) {
        d = new Date(today);
      } else {
        d = targetDate;
      }
    } else if (mode === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (mode === 'day') {
      d.setDate(d.getDate() + 1);
    } else if (mode === 'agenda') {
      d.setDate(d.getDate() + 30);
    }
    this.selectedDate.set(d);
    this.loadEvents().subscribe();
  }

  prevPeriod(): void {
    let d = new Date(this.selectedDate());
    const mode = this.viewMode();

    if (mode === 'month') {
      const year = d.getFullYear();
      const month = d.getMonth();
      const today = new Date();
      const targetDate = new Date(year, month - 1, 1);
      if (
        today.getFullYear() === targetDate.getFullYear() &&
        today.getMonth() === targetDate.getMonth()
      ) {
        d = new Date(today);
      } else {
        d = targetDate;
      }
    } else if (mode === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (mode === 'day') {
      d.setDate(d.getDate() - 1);
    } else if (mode === 'agenda') {
      d.setDate(d.getDate() - 30);
    }
    this.selectedDate.set(d);
    this.loadEvents().subscribe();
  }

  goToToday(): void {
    this.selectedDate.set(new Date());
    this.loadEvents().subscribe();
  }

  setViewMode(mode: CalendarViewMode): void {
    this.viewMode.set(mode);
    this.loadEvents().subscribe();
  }

  selectDate(date: Date): void {
    this.selectedDate.set(new Date(date));
    this.loadEvents().subscribe();
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  private mapRawEvent(r: RawCalendarEventDto): CalendarEvent {
    // Generate a pleasant color palette according to title hash if none provided
    const palette = ['#2d6a4f', '#2563eb', '#7c3aed', '#d97706', '#059669', '#dc2626', '#4f46e5'];
    let colorHash = 0;
    for (let i = 0; i < r.title.length; i++) {
      colorHash = (colorHash + r.title.charCodeAt(i)) % palette.length;
    }
    const color = palette[colorHash];

    const mappedReminders: EventReminder[] = (r.reminders || []).map((rem) => ({
      id: rem.reminderId,
      leadTimeMinutes: rem.leadTimeMinutes,
      triggerTime: rem.triggerTime,
      status: (rem.status as any) || 'PENDING',
    }));

    return {
      id: r.eventId,
      workspaceId: r.workspaceId,
      userId: r.userId,
      taskId: r.taskId,
      title: r.title,
      description: r.description,
      startTime: r.startTime,
      endTime: r.endTime,
      isAllDay: false,
      color,
      reminders: mappedReminders,
      status: r.status || 'SCHEDULED',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      version: r.version || 0,
    };
  }
}
