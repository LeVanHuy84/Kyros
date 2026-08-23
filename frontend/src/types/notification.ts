export type UrgencyLevel = 'Low' | 'Normal' | 'Urgent' | 'Critical';
export type NotificationChannel = 'InApp' | 'Email' | 'Slack';
export type NotificationStatus = 'Unread' | 'Read' | 'Dismissed';

export interface InAppNotification {
  notificationId: string;
  workspaceId: string;
  title: string;
  content: string;
  urgencyLevel: UrgencyLevel;
  status: NotificationStatus;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface NotificationProfile {
  workspaceId: string;
  channelRoutingMap: Record<UrgencyLevel, NotificationChannel[]>;
  emailAddress?: string;
  slackWebhookRef?: string;
  digestSchedule?: string;
  consentPolicy: 'ENABLED' | 'DISABLED';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}
