export type NotificationType = 'system' | 'task' | 'calendar' | 'agent' | 'reminder';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface AppNotification {
  id: string;
  title: string;
  titleEn?: string;
  message: string;
  messageEn?: string;
  type: NotificationType;
  priority?: NotificationPriority;
  isRead: boolean;
  createdAt: string; // ISO string
  actionUrl?: string;
  actionLabel?: string;
  actionLabelEn?: string;
  meta?: Record<string, unknown>;
}
