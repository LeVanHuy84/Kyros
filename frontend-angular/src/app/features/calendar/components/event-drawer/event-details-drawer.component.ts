import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarEvent, EventReminder } from '../../models/calendar.models';
import { CalendarService } from '../../services/calendar.service';
import { LanguageService } from '@core/services/language.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-event-details-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, ButtonComponent],
  templateUrl: './event-details-drawer.component.html',
  styleUrl: './event-details-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailsDrawerComponent {
  readonly calendarService = inject(CalendarService);
  readonly languageService = inject(LanguageService);
  private readonly toast = inject(ToastService);

  isOpen = input.required<boolean>();
  event = input<CalendarEvent | null>(null);

  close = output<void>();
  editClicked = output<CalendarEvent>();
  eventDeleted = output<void>();

  // Inline Quick Reschedule state
  readonly isRescheduleOpen = signal<boolean>(false);
  readonly newStartDate = signal<string>('');
  readonly newStartTime = signal<string>('');
  readonly newEndDate = signal<string>('');
  readonly newEndTime = signal<string>('');

  // Add reminder state
  readonly isAddReminderOpen = signal<boolean>(false);
  readonly selectedLeadMinutes = signal<number>(15);

  // Delete confirmation
  readonly showDeleteConfirm = signal<boolean>(false);

  readonly formattedDateTime = computed<string>(() => {
    const ev = this.event();
    if (!ev) return '';

    const start = new Date(ev.startTime);
    const end = new Date(ev.endTime);

    const dateStr = start.toLocaleDateString(
      this.languageService.currentLanguage() === 'vi' ? 'vi-VN' : 'en-US',
      { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    );

    const startH = start.getHours().toString().padStart(2, '0');
    const startM = start.getMinutes().toString().padStart(2, '0');
    const endH = end.getHours().toString().padStart(2, '0');
    const endM = end.getMinutes().toString().padStart(2, '0');

    return `${dateStr} • ${startH}:${startM} - ${endH}:${endM}`;
  });

  readonly durationMinutes = computed<number>(() => {
    const ev = this.event();
    if (!ev) return 0;
    const diff = new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime();
    return Math.max(0, Math.round(diff / 60000));
  });

  readonly isConflict = computed<boolean>(() => {
    const ev = this.event();
    return ev ? this.calendarService.conflictingEventIds().has(ev.id) : false;
  });

  toggleReschedule(): void {
    const ev = this.event();
    if (!ev) return;

    if (!this.isRescheduleOpen()) {
      const start = new Date(ev.startTime);
      const end = new Date(ev.endTime);
      this.newStartDate.set(this.formatDateForInput(start));
      this.newStartTime.set(this.formatTimeForInput(start));
      this.newEndDate.set(this.formatDateForInput(end));
      this.newEndTime.set(this.formatTimeForInput(end));
      this.isRescheduleOpen.set(true);
    } else {
      this.isRescheduleOpen.set(false);
    }
  }

  saveReschedule(): void {
    const ev = this.event();
    if (!ev) return;

    const startIso = new Date(`${this.newStartDate()}T${this.newStartTime()}:00`).toISOString();
    const endIso = new Date(`${this.newEndDate()}T${this.newEndTime()}:00`).toISOString();

    this.calendarService.rescheduleEvent(ev.id, startIso, endIso).subscribe({
      next: () => {
        this.toast.success(this.languageService.t().common.success);
        this.isRescheduleOpen.set(false);
      },
      error: () => {
        this.toast.error(this.languageService.t().common.error);
      },
    });
  }

  onAddReminder(): void {
    const ev = this.event();
    if (!ev) return;

    this.calendarService.addReminder(ev.id, this.selectedLeadMinutes()).subscribe({
      next: () => {
        this.toast.success(this.languageService.t().common.success);
        this.isAddReminderOpen.set(false);
      },
      error: () => {
        this.toast.error(this.languageService.t().common.error);
      },
    });
  }

  onDeleteReminder(reminderId: string): void {
    const ev = this.event();
    if (!ev) return;

    this.calendarService.removeReminder(ev.id, reminderId).subscribe({
      next: () => {
        this.toast.success(this.languageService.t().common.success);
      },
    });
  }

  onSnoozeReminder(reminderId: string, mins: number = 5): void {
    const ev = this.event();
    if (!ev) return;

    this.calendarService.snoozeReminder(ev.id, reminderId, mins).subscribe({
      next: () => {
        this.toast.success(this.languageService.t().common.success);
      },
    });
  }

  onDismissReminder(reminderId: string): void {
    const ev = this.event();
    if (!ev) return;

    this.calendarService.dismissReminder(ev.id, reminderId).subscribe({
      next: () => {
        this.toast.success(this.languageService.t().common.success);
      },
    });
  }

  onDeleteEvent(): void {
    const ev = this.event();
    if (!ev) return;

    this.calendarService.deleteEvent(ev.id).subscribe({
      next: () => {
        this.toast.success(this.languageService.t().common.success);
        this.eventDeleted.emit();
        this.close.emit();
      },
      error: () => {
        this.toast.error(this.languageService.t().common.error);
      },
    });
  }

  onEdit(): void {
    const ev = this.event();
    if (ev) {
      this.editClicked.emit(ev);
      this.close.emit();
    }
  }

  private formatDateForInput(d: Date): string {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatTimeForInput(d: Date): string {
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}
