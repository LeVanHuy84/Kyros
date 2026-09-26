import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService } from '../../services/calendar.service';
import { CalendarEvent, EventReminder } from '../../models/calendar.models';
import { LanguageService } from '@core/services/language.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { AppIconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-reminder-toasts',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  templateUrl: './reminder-toasts.component.html',
  styleUrl: './reminder-toasts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReminderToastsComponent implements OnInit, OnDestroy {
  readonly calendarService = inject(CalendarService);
  readonly languageService = inject(LanguageService);
  private readonly toast = inject(ToastService);

  private timerInterval?: any;

  readonly activeReminders = computed(() => {
    return this.calendarService.activeTriggeredReminders();
  });

  ngOnInit(): void {
    // Periodically re-check every 30 seconds
    this.timerInterval = setInterval(() => {
      // Periodic background reload to catch upcoming reminders
      this.calendarService.loadEvents().subscribe();
    }, 30_000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  onSnooze(event: CalendarEvent, reminder: EventReminder, minutes: number): void {
    this.calendarService.snoozeReminder(event.id, reminder.id, minutes).subscribe({
      next: () => {
        this.toast.info(`Đã báo lại sự kiện "${event.title}" sau ${minutes} phút.`);
      },
    });
  }

  onDismiss(event: CalendarEvent, reminder: EventReminder): void {
    this.calendarService.dismissReminder(event.id, reminder.id).subscribe({
      next: () => {
        this.toast.info(`Đã hoàn tất nhắc nhở sự kiện "${event.title}".`);
      },
    });
  }

  getMinutesUntilStart(event: CalendarEvent): number {
    const diff = new Date(event.startTime).getTime() - Date.now();
    return Math.max(0, Math.round(diff / 60000));
  }

  formatTime(isoStr: string): string {
    const d = new Date(isoStr);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}
