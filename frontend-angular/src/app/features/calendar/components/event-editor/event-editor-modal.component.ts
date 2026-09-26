import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { LanguageService } from '@core/services/language.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { CalendarService } from '../../services/calendar.service';
import { CalendarEvent, CreateCalendarEventDto } from '../../models/calendar.models';

@Component({
  selector: 'app-event-editor-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    AppIconComponent,
  ],
  templateUrl: './event-editor-modal.component.html',
  styleUrl: './event-editor-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventEditorModalComponent {
  readonly calendarService = inject(CalendarService);
  readonly languageService = inject(LanguageService);
  private readonly toast = inject(ToastService);

  isOpen = input.required<boolean>();
  event = input<CalendarEvent | null>(null);
  initialDate = input<Date | null>(null);
  initialHour = input<number | null>(null);

  close = output<void>();
  saved = output<void>();

  // Form State Signals
  title = signal<string>('');
  description = signal<string>('');
  startDate = signal<string>('');
  startTime = signal<string>('09:00');
  endDate = signal<string>('');
  endTime = signal<string>('10:00');
  isAllDay = signal<boolean>(false);
  reminderOffsets = signal<number[]>([15]);

  readonly isEditMode = computed<boolean>(() => this.event() !== null);
  readonly modalTitle = computed<string>(() =>
    this.isEditMode()
      ? this.languageService.t().calendar.form.editTitle
      : this.languageService.t().calendar.form.createTitle
  );

  constructor() {
    effect(
      () => {
        if (!this.isOpen()) return;

        const ev = this.event();
        if (ev) {
          // Populate edit mode
          this.title.set(ev.title);
          this.description.set(ev.description || '');

          const start = new Date(ev.startTime);
          const end = new Date(ev.endTime);

          this.startDate.set(this.formatDateForInput(start));
          this.startTime.set(this.formatTimeForInput(start));
          this.endDate.set(this.formatDateForInput(end));
          this.endTime.set(this.formatTimeForInput(end));
          this.isAllDay.set(ev.isAllDay || false);
          this.reminderOffsets.set(
            ev.reminders?.length
              ? ev.reminders.map((r) => r.leadTimeMinutes)
              : [15]
          );
        } else {
          // Reset create mode
          this.title.set('');
          this.description.set('');

          const baseDate = this.initialDate() ? new Date(this.initialDate()!) : new Date();
          const startH = this.initialHour() !== null && this.initialHour() !== undefined ? this.initialHour()! : 9;

          const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), startH, 0);
          const end = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), startH + 1, 0);

          this.startDate.set(this.formatDateForInput(start));
          this.startTime.set(this.formatTimeForInput(start));
          this.endDate.set(this.formatDateForInput(end));
          this.endTime.set(this.formatTimeForInput(end));
          this.isAllDay.set(false);
          this.reminderOffsets.set([15]);
        }
      },
      { allowSignalWrites: true }
    );
  }

  toggleReminder(mins: number): void {
    const list = this.reminderOffsets();
    if (list.includes(mins)) {
      this.reminderOffsets.set(list.filter((m) => m !== mins));
    } else {
      this.reminderOffsets.set([...list, mins]);
    }
  }

  onSave(): void {
    if (!this.title().trim()) {
      this.toast.warning(this.languageService.t().calendar.form.titleLabel);
      return;
    }

    const startIso = new Date(`${this.startDate()}T${this.startTime()}:00`).toISOString();
    const endIso = new Date(`${this.endDate()}T${this.endTime()}:00`).toISOString();

    const ev = this.event();
    if (ev) {
      // Update existing
      this.calendarService
        .updateEventMetadata(ev.id, this.title(), this.description())
        .subscribe({
          next: () => {
            // Also reschedule if time changed
            if (ev.startTime !== startIso || ev.endTime !== endIso) {
              this.calendarService.rescheduleEvent(ev.id, startIso, endIso).subscribe();
            }
            this.toast.success(this.languageService.t().common.success);
            this.saved.emit();
            this.close.emit();
          },
          error: () => {
            this.toast.error(this.languageService.t().common.error);
          },
        });
    } else {
      // Create new
      const dto: CreateCalendarEventDto = {
        title: this.title().trim(),
        description: this.description().trim() || undefined,
        startTime: startIso,
        endTime: endIso,
        reminderOffsetsMinutes: this.reminderOffsets(),
        isAllDay: this.isAllDay(),
      };

      this.calendarService.createEvent(dto).subscribe({
        next: () => {
          this.toast.success(this.languageService.t().common.success);
          this.saved.emit();
          this.close.emit();
        },
        error: () => {
          this.toast.error(this.languageService.t().common.error);
        },
      });
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
