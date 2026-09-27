import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarEvent } from '../../models/calendar.models';
import { LanguageService } from '@core/services/language.service';
import { AppIconComponent } from '@shared/components/icon/icon.component';

export interface DayTimelineEvent {
  event: CalendarEvent;
  topPx: number;
  heightPx: number;
  isConflict: boolean;
  isShort: boolean;
  formattedTime: string;
}

@Component({
  selector: 'app-day-view',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  templateUrl: './day-view.component.html',
  styleUrl: './day-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayViewComponent implements AfterViewInit {
  readonly languageService = inject(LanguageService);

  @ViewChild('dayScroll') dayScroll?: ElementRef<HTMLDivElement>;

  selectedDate = input.required<Date>();
  events = input<CalendarEvent[]>([]);
  conflictingEventIds = input<Set<string>>(new Set());

  slotClicked = output<{ date: Date; hour: number }>();
  eventClicked = output<CalendarEvent>();

  readonly hours = Array.from({ length: 24 }, (_, i) => i);

  readonly dayInfo = computed(() => {
    const sel = new Date(this.selectedDate());
    const dayOfWeek = (sel.getDay() + 6) % 7;
    const tWeek = this.languageService.t().calendar.fullWeekdays;
    const fullDayNames = [
      tWeek.mon,
      tWeek.tue,
      tWeek.wed,
      tWeek.thu,
      tWeek.fri,
      tWeek.sat,
      tWeek.sun,
    ];

    const today = new Date();
    const isToday =
      today.getFullYear() === sel.getFullYear() &&
      today.getMonth() === sel.getMonth() &&
      today.getDate() === sel.getDate();

    return {
      dayName: fullDayNames[dayOfWeek],
      dayNumber: sel.getDate(),
      monthNumber: sel.getMonth() + 1,
      year: sel.getFullYear(),
      isToday,
    };
  });

  readonly dayEvents = computed<DayTimelineEvent[]>(() => {
    const sel = new Date(this.selectedDate());
    const dayStartMs = new Date(
      sel.getFullYear(),
      sel.getMonth(),
      sel.getDate(),
      0,
      0,
      0
    ).getTime();
    const dayEndMs = new Date(
      sel.getFullYear(),
      sel.getMonth(),
      sel.getDate(),
      23,
      59,
      59,
      999
    ).getTime();

    const conflictSet = this.conflictingEventIds();

    const filtered = this.events().filter((e) => {
      const evStart = new Date(e.startTime).getTime();
      const evEnd = new Date(e.endTime).getTime();
      return (
        (evStart >= dayStartMs && evStart <= dayEndMs) ||
        (evEnd >= dayStartMs && evEnd <= dayEndMs) ||
        (evStart <= dayStartMs && evEnd >= dayEndMs)
      );
    });

    return filtered.map((e) => {
      const evStartDate = new Date(e.startTime);
      const evEndDate = new Date(e.endTime);

      let startMinutes = evStartDate.getHours() * 60 + evStartDate.getMinutes();
      if (evStartDate.getTime() < dayStartMs) startMinutes = 0;

      let endMinutes = evEndDate.getHours() * 60 + evEndDate.getMinutes();
      if (evEndDate.getTime() > dayEndMs) endMinutes = 24 * 60;

      const rawDuration = Math.max(15, endMinutes - startMinutes);
      const isShort = rawDuration <= 30;
      const topPx = (startMinutes / 60) * 64; // 64px per hour in day view
      const heightPx = isShort
        ? Math.max(28, Math.round((rawDuration / 60) * 64))
        : Math.max(42, Math.round((rawDuration / 60) * 64));

      const startH = evStartDate.getHours().toString().padStart(2, '0');
      const startM = evStartDate.getMinutes().toString().padStart(2, '0');
      const endH = evEndDate.getHours().toString().padStart(2, '0');
      const endM = evEndDate.getMinutes().toString().padStart(2, '0');

      return {
        event: e,
        topPx,
        heightPx,
        isConflict: conflictSet.has(e.id),
        isShort,
        formattedTime: `${startH}:${startM} - ${endH}:${endM}`,
      };
    });
  });

  readonly currentTimeTopPx = computed<number | null>(() => {
    const sel = new Date(this.selectedDate());
    const today = new Date();
    if (
      today.getFullYear() !== sel.getFullYear() ||
      today.getMonth() !== sel.getMonth() ||
      today.getDate() !== sel.getDate()
    ) {
      return null;
    }
    const minutes = today.getHours() * 60 + today.getMinutes();
    return (minutes / 60) * 64;
  });

  ngAfterViewInit(): void {
    if (this.dayScroll?.nativeElement) {
      this.dayScroll.nativeElement.scrollTop = 8 * 64;
    }
  }

  onSlotClick(hour: number): void {
    this.slotClicked.emit({ date: new Date(this.selectedDate()), hour });
  }

  onEventCardClick(event: MouseEvent, calEvent: CalendarEvent): void {
    event.stopPropagation();
    this.eventClicked.emit(calEvent);
  }

  formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }
}
