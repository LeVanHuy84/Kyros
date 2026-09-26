import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent } from '../../models/calendar.models';
import { LanguageService } from '@core/services/language.service';
import { AppIconComponent } from '@shared/components/icon/icon.component';

export interface MonthDayCell {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-month-view',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  templateUrl: './month-view.component.html',
  styleUrl: './month-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthViewComponent {
  readonly languageService = inject(LanguageService);

  selectedDate = input.required<Date>();
  events = input<CalendarEvent[]>([]);
  conflictingEventIds = input<Set<string>>(new Set());

  dayClicked = output<Date>();
  eventClicked = output<CalendarEvent>();

  readonly weekdays = computed(() => {
    const t = this.languageService.t().calendar.weekdays;
    return [t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun];
  });

  readonly cells = computed<MonthDayCell[]>(() => {
    const sel = new Date(this.selectedDate());
    const year = sel.getFullYear();
    const month = sel.getMonth();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const selStr = `${sel.getFullYear()}-${sel.getMonth()}-${sel.getDate()}`;

    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOffset = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0

    const startDate = new Date(year, month, 1 - firstDayOffset);
    const dayCells: MonthDayCell[] = [];
    const allEvents = this.events();

    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate() + i
      );
      const cellDateStr = `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`;

      // Find events on this day
      const dayStart = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate(), 0, 0, 0).getTime();
      const dayEnd = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate(), 23, 59, 59, 999).getTime();

      const dayEvents = allEvents.filter((e) => {
        const evStart = new Date(e.startTime).getTime();
        const evEnd = new Date(e.endTime).getTime();
        return (evStart >= dayStart && evStart <= dayEnd) ||
               (evEnd >= dayStart && evEnd <= dayEnd) ||
               (evStart <= dayStart && evEnd >= dayEnd);
      });

      dayCells.push({
        date: cellDate,
        dayNumber: cellDate.getDate(),
        isCurrentMonth: cellDate.getMonth() === month,
        isToday: cellDateStr === todayStr,
        isSelected: false,
        events: dayEvents,
      });
    }

    return dayCells;
  });

  onCellClick(cell: MonthDayCell): void {
    this.dayClicked.emit(cell.date);
  }

  onEventClick(event: MouseEvent, calEvent: CalendarEvent): void {
    event.stopPropagation();
    this.eventClicked.emit(calEvent);
  }

  formatEventTime(isoTime: string): string {
    const d = new Date(isoTime);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  isConflict(eventId: string): boolean {
    return this.conflictingEventIds().has(eventId);
  }

  formatMoreEvents(count: number): string {
    return this.languageService
      .t()
      .calendar.moreEvents.replace('{count}', count.toString());
  }
}
