import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppIconComponent, AppIconName } from '@shared/components/icon/icon.component';
import { NotificationService } from '@core/services/notification.service';
import { LanguageService } from '@core/services/language.service';
import { AppNotification, NotificationType } from '@core/models/notification.models';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  templateUrl: './notification-dropdown.component.html',
  styleUrl: './notification-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationDropdownComponent {
  readonly notificationService = inject(NotificationService);
  readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  readonly isOpen = signal<boolean>(false);
  readonly activeTab = signal<'all' | 'unread'>('all');

  readonly filteredNotifications = computed(() => {
    const list = this.notificationService.notifications();
    if (this.activeTab() === 'unread') {
      return list.filter((n) => !n.isRead);
    }
    return list;
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    this.isOpen.set(false);
  }

  toggleDropdown(): void {
    this.isOpen.update((v) => !v);
  }

  setTab(tab: 'all' | 'unread'): void {
    this.activeTab.set(tab);
  }

  handleItemClick(item: AppNotification): void {
    if (!item.isRead) {
      this.notificationService.markAsRead(item.id);
    }
    if (item.actionUrl) {
      this.isOpen.set(false);
      this.router.navigateByUrl(item.actionUrl);
    }
  }

  handleMarkRead(event: MouseEvent, item: AppNotification): void {
    event.stopPropagation();
    this.notificationService.markAsRead(item.id);
  }

  handleDelete(event: MouseEvent, item: AppNotification): void {
    event.stopPropagation();
    this.notificationService.removeNotification(item.id);
  }

  handleMarkAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  handleClearAllRead(): void {
    this.notificationService.clearAllRead();
  }

  getNotificationTitle(item: AppNotification): string {
    const lang = this.languageService.currentLanguage();
    if (lang === 'en' && item.titleEn) {
      return item.titleEn;
    }
    return item.title;
  }

  getNotificationMessage(item: AppNotification): string {
    const lang = this.languageService.currentLanguage();
    if (lang === 'en' && item.messageEn) {
      return item.messageEn;
    }
    return item.message;
  }

  getNotificationActionLabel(item: AppNotification): string {
    const lang = this.languageService.currentLanguage();
    if (lang === 'en' && item.actionLabelEn) {
      return item.actionLabelEn;
    }
    return item.actionLabel || this.languageService.t().notifications.viewDetails;
  }

  getTypeIcon(type: NotificationType): AppIconName {
    switch (type) {
      case 'calendar':
        return 'calendar';
      case 'task':
        return 'check-square';
      case 'agent':
        return 'bot';
      case 'reminder':
        return 'clock';
      case 'system':
      default:
        return 'bell';
    }
  }

  formatTimeAgo(createdAt: string): string {
    const timeMs = new Date(createdAt).getTime();
    const nowMs = Date.now();
    const diffSec = Math.max(0, Math.floor((nowMs - timeMs) / 1000));
    const t = this.languageService.t().notifications.timeAgo;

    if (diffSec < 60) {
      return t.justNow;
    }
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return t.minutesAgo.replace('{m}', diffMin.toString());
    }
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
      return t.hoursAgo.replace('{h}', diffHours.toString());
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return t.yesterday;
    }
    return t.daysAgo.replace('{d}', diffDays.toString());
  }
}
