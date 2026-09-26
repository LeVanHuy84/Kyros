import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppNotification, NotificationPriority, NotificationType } from '../models/notification.models';
import { WorkspaceContextService } from './workspace-context.service';
import { SseService } from './sse.service';
import { environment } from '@env/environment';
import { catchError, of } from 'rxjs';

interface BackendNotificationResponse {
  notificationId: string;
  workspaceId: string;
  title: string;
  content: string;
  urgencyLevel: string;
  status: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

interface NotificationsApiResponse {
  data: BackendNotificationResponse[];
  meta: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly STORAGE_KEY = 'kyros_notifications_data';
  private readonly http = inject(HttpClient);
  private readonly workspaceService = inject(WorkspaceContextService);
  private readonly sseService = inject(SseService);

  readonly notifications = signal<AppNotification[]>(this.loadInitialNotifications());
  readonly isLoading = signal<boolean>(false);

  readonly unreadCount = computed(() => {
    return this.notifications().filter((n) => !n.isRead).length;
  });

  readonly hasUnread = computed(() => this.unreadCount() > 0);

  constructor() {
    // Automatically fetch notifications whenever active workspace changes
    effect(() => {
      const wsId = this.workspaceService.activeWorkspaceId();
      if (wsId) {
        this.fetchNotificationsFromApi(wsId);
        this.initSseStream(wsId);
      }
    });
  }

  /**
   * Fetch in-app notifications from backend API
   */
  fetchNotificationsFromApi(workspaceId: string): void {
    this.isLoading.set(true);
    const url = `/api/v1/workspaces/${workspaceId}/notifications?status=All&page=0&size=50`;

    this.http
      .get<NotificationsApiResponse>(url)
      .pipe(
        catchError((err) => {
          console.warn('[NotificationService] API request failed, using cached notifications:', err);
          return of(null);
        })
      )
      .subscribe((res) => {
        this.isLoading.set(false);
        if (res && Array.isArray(res.data)) {
          const mapped: AppNotification[] = res.data.map((item) =>
            this.mapFromBackend(item)
          );
          this.persist(mapped);
        }
      });
  }

  /**
   * Listen to real-time notification stream via Server-Sent Events (SSE)
   */
  private initSseStream(workspaceId: string): void {
    const streamUrl = `/api/v1/workspaces/${workspaceId}/notifications/stream`;
    this.sseService
      .stream<any>(streamUrl)
      .pipe(catchError(() => of(null)))
      .subscribe((event) => {
        if (event?.data) {
          const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (payload?.notificationId || payload?.title) {
            const newNotif = this.mapFromBackend({
              notificationId: payload.notificationId || payload.id || `notif-${Date.now()}`,
              workspaceId: payload.workspaceId || workspaceId,
              title: payload.title || 'Thông báo mới',
              content: payload.content || payload.message || '',
              urgencyLevel: payload.urgencyLevel || 'NORMAL',
              status: 'Unread',
              metadata: payload.metadata || {},
              createdAt: payload.createdAt || new Date().toISOString(),
            });

            this.persist([newNotif, ...this.notifications().filter((n) => n.id !== newNotif.id)]);
          }
        }
      });
  }

  private mapFromBackend(item: BackendNotificationResponse): AppNotification {
    const rawType = (item.metadata?.['type'] || 'system').toLowerCase();
    const type: NotificationType = ['calendar', 'task', 'agent', 'reminder', 'system'].includes(rawType)
      ? (rawType as NotificationType)
      : 'system';

    const rawPriority = (item.urgencyLevel || 'NORMAL').toLowerCase();
    const priority: NotificationPriority = ['low', 'normal', 'high', 'urgent'].includes(rawPriority)
      ? (rawPriority as NotificationPriority)
      : 'normal';

    return {
      id: item.notificationId,
      title: item.title,
      titleEn: item.metadata?.['titleEn'],
      message: item.content,
      messageEn: item.metadata?.['messageEn'],
      type,
      priority,
      isRead: item.status?.toUpperCase() === 'READ',
      createdAt: item.createdAt || new Date().toISOString(),
      actionUrl: item.metadata?.['actionUrl'],
      actionLabel: item.metadata?.['actionLabel'],
      actionLabelEn: item.metadata?.['actionLabelEn'],
      meta: item.metadata,
    };
  }

  private loadInitialNotifications(): AppNotification[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return [];
  }

  private persist(data: AppNotification[]): void {
    this.notifications.set(data);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore quota errors
    }
  }

  markAsRead(id: string): void {
    const updated = this.notifications().map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    this.persist(updated);

    const wsId = this.workspaceService.activeWorkspaceId();
    if (wsId && this.isUuid(id)) {
      const url = `/api/v1/workspaces/${wsId}/notifications/${id}/read`;
      this.http.post(url, {}).pipe(catchError(() => of(null))).subscribe();
    }
  }

  markAllAsRead(): void {
    const updated = this.notifications().map((n) => ({ ...n, isRead: true }));
    this.persist(updated);

    const wsId = this.workspaceService.activeWorkspaceId();
    if (wsId) {
      const url = `/api/v1/workspaces/${wsId}/notifications/read-all`;
      this.http.post(url, {}).pipe(catchError(() => of(null))).subscribe();
    }
  }

  removeNotification(id: string): void {
    const updated = this.notifications().filter((n) => n.id !== id);
    this.persist(updated);

    const wsId = this.workspaceService.activeWorkspaceId();
    if (wsId && this.isUuid(id)) {
      const url = `/api/v1/workspaces/${wsId}/notifications/${id}/dismiss`;
      this.http.post(url, {}).pipe(catchError(() => of(null))).subscribe();
    }
  }

  clearAllRead(): void {
    const updated = this.notifications().filter((n) => !n.isRead);
    this.persist(updated);
  }

  addNotification(
    payload: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>
  ): void {
    const newNotif: AppNotification = {
      ...payload,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    const updated = [newNotif, ...this.notifications()];
    this.persist(updated);
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );
  }
}
