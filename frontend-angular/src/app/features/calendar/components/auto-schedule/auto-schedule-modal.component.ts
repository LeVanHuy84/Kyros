import {
  ChangeDetectionStrategy,
  Component,
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
import { CalendarEvent } from '../../models/calendar.models';

@Component({
  selector: 'app-auto-schedule-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    AppIconComponent,
  ],
  templateUrl: './auto-schedule-modal.component.html',
  styleUrl: './auto-schedule-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoScheduleModalComponent {
  readonly calendarService = inject(CalendarService);
  readonly languageService = inject(LanguageService);
  private readonly toast = inject(ToastService);

  isOpen = input.required<boolean>();
  close = output<void>();
  scheduled = output<CalendarEvent[]>();

  selectedDaysAhead = signal<number>(7);
  scheduledResults = signal<CalendarEvent[] | null>(null);

  onAutoSchedule(): void {
    this.calendarService.autoScheduleTasks(this.selectedDaysAhead()).subscribe({
      next: (results) => {
        this.scheduledResults.set(results);
        this.scheduled.emit(results);
        this.toast.success(
          this.languageService
            .t()
            .calendar.autoScheduleModal.successDesc.replace(
              '{count}',
              results.length.toString()
            )
        );
      },
      error: () => {
        this.toast.error(this.languageService.t().common.error);
      },
    });
  }

  onResetAndClose(): void {
    this.scheduledResults.set(null);
    this.close.emit();
  }
}
