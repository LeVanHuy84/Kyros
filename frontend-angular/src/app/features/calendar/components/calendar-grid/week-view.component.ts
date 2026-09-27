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

export interface WeekDayColumn {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  events: {
    event: CalendarEvent;
    topPx: number;
    heightPx: number;
    isConflict: boolean;
    isShort: boolean;
    shortTime: string;
    formattedTime: string;
  }[];
}

@Component({
  selector: 'app-week-view',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  templateUrl: './week-view.component.html',
  styleUrl: './week-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekViewComponent implements AfterViewInit {
  readonly languageService = inject(LanguageService);

  @ViewChild('timelineScroll') timelineScroll?: ElementRef<HTMLDivElement>;

  selectedDate = input.required<Date>();
  events = input<CalendarEvent[]>([]);
  conflictingEventIds = input<Set<string>>(new Set());

  slotClicked = output<{ date: Date; hour: number }>();
  eventClicked = output<CalendarEvent>();

  readonly hours = Array.from({ length: 24 }, (_, i) => i);

  readonly columns = computed<WeekDayColumn[]>(() => {
    const sel = new Date(this.selectedDate());
    const dayOfWeek = (sel.getDay() + 6) % 7; // Monday = 0
    const startOfWeek = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() - dayOfWeek);

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const allEvents = this.events();
    const conflictSet = this.conflictingEventIds();

    const tWeek = this.languageService.t().calendar.weekdays;
    const weekdayNames = [
      tWeek.mon,
      tWeek.tue,
      tWeek.wed,
      tWeek.thu,
      tWeek.fri,
      tWeek.sat,
      tWeek.sun,
    ];

    const cols: WeekDayColumn[] = [];

    for (let d = 0; d < 7; d++) {
      const colDate = new Date(
        startOfWeek.getFullYear(),
        startOfWeek.getMonth(),
        startOfWeek.getDate() + d
      );
      const colDateStr = `${colDate.getFullYear()}-${colDate.getMonth()}-${colDate.getDate()}`;

      const dayStartMs = new Date(
        colDate.getFullYear(),
        colDate.getMonth(),
        colDate.getDate(),
        0,
        0,
        0
      ).getTime();
      const dayEndMs = new Date(
        colDate.getFullYear(),
        colDate.getMonth(),
        colDate.getDate(),
        23,
        59,
        59,
        999
      ).getTime();

      const dayEvents = allEvents.filter((e) => {
        const evStart = new Date(e.startTime).getTime();
        const evEnd = new Date(e.endTime).getTime();
        return (
          (evStart >= dayStartMs && evStart <= dayEndMs) ||
          (evEnd >= dayStartMs && evEnd <= dayEndMs) ||
          (evStart <= dayStartMs && evEnd >= dayEndMs)
        );
      });

      const mappedEvents = dayEvents.map((e) => {
        const evStartDate = new Date(e.startTime);
        const evEndDate = new Date(e.endTime);

        let startMinutes = evStartDate.getHours() * 60 + evStartDate.getMinutes();
        if (evStartDate.getTime() < dayStartMs) startMinutes = 0;

        let endMinutes = evEndDate.getHours() * 60 + evEndDate.getMinutes();
        if (evEndDate.getTime() > dayEndMs) endMinutes = 24 * 60;

        const rawDuration = Math.max(15, endMinutes - startMinutes);
        const isShort = rawDuration <= 35;
        const topPx = (startMinutes / 60) * 56; // 56px per hour
        const heightPx = isShort
          ? Math.max(24, Math.round((rawDuration / 60) * 56))
          : Math.max(38, Math.round((rawDuration / 60) * 56));

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
          shortTime: `${startH}:${startM}`,
          formattedTime: `${startH}:${startM} - ${endH}:${endM}`,
        };
      });

      cols.push({
        date: colDate,
        dayName: weekdayNames[d],
        dayNumber: colDate.getDate(),
        isToday: colDateStr === todayStr,
        events: mappedEvents,
      });
    }

    return cols;
  });

  // Current time position in pixels
  readonly currentTimeTopPx = computed<number | null>(() => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    return (minutes / 60) * 56;
  });

  ngAfterViewInit(): void {
    // Scroll to 8:00 AM by default
    if (this.timelineScroll?.nativeElement) {
      this.timelineScroll.nativeElement.scrollTop = 8 * 56;
    }
  }

  onSlotClick(colDate: Date, hour: number): void {
    this.slotClicked.emit({ date: colDate, hour });
  }

  onEventCardClick(event: MouseEvent, calEvent: CalendarEvent): void {
    event.stopPropagation();
    this.eventClicked.emit(calEvent);
  }

  formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }
}
