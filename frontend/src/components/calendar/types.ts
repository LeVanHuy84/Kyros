export interface Reminder {
  reminderId: string;
  leadTimeMinutes: number;
  triggerTime: string;
  status: 'Scheduled' | 'Triggered' | 'Snoozed' | 'Dismissed';
}

export interface CalendarEvent {
  eventId: string;
  workspaceId: string;
  userId: string;
  taskId?: string;
  title: string;
  description: string;
  startTime: string; // ISO-8601
  endTime: string; // ISO-8601
  status: 'Scheduled' | 'Deleted';
  reminders: Reminder[];
}
