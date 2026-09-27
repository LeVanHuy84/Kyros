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
import { ButtonComponent } from '@shared/components/button/button.component';

export interface AgendaDateGroup {
  dateStr: string;
  dayNumber: number;
  dayName: string;
  monthYear: string;
  isToday: boolean;
  events: {
    event: CalendarEvent;
    formattedTime: string;
    durationMinutes: number;
    isConflict: boolean;
  }[];
}

@Component({
  selector: 'app-agenda-view',
  standalone: true,
  imports: [CommonModule, AppIconComponent, ButtonComponent],
  templateUrl: './agenda-view.component.html',
  styleUrl: './agenda-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaViewComponent {
  readonly languageService = inject(LanguageService);

  events = input<CalendarEvent[]>([]);
  conflictingEventIds = input<Set<string>>(new Set());

  eventClicked = output<CalendarEvent>();
  createClicked = output<void>();

  readonly groups = computed<AgendaDateGroup[]>(() => {
    const sorted = [...this.events()].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const conflictSet = this.conflictingEventIds();
    const mapByDate = new Map<string, AgendaDateGroup>();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    const tWeek = this.languageService.t().calendar.fullWeekdays;
    const weekdayNames = [
      tWeek.mon,
      tWeek.tue,
      tWeek.wed,
      tWeek.thu,
      tWeek.fri,
      tWeek.sat,
      tWeek.sun,
    ];

    for (const ev of sorted) {
      const d = new Date(ev.startTime);
      const groupKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const dayOfWeek = (d.getDay() + 6) % 7;

      const startH = d.getHours().toString().padStart(2, '0');
      const startM = d.getMinutes().toString().padStart(2, '0');
      const endD = new Date(ev.endTime);
      const endH = endD.getHours().toString().padStart(2, '0');
      const endM = endD.getMinutes().toString().padStart(2, '0');

      const durationMinutes = Math.max(
        0,
        Math.round((endD.getTime() - d.getTime()) / 60000)
      );

      if (!mapByDate.has(groupKey)) {
        mapByDate.set(groupKey, {
          dateStr: groupKey,
          dayNumber: d.getDate(),
          dayName: weekdayNames[dayOfWeek],
          monthYear: `${d.getMonth() + 1}/${d.getFullYear()}`,
          isToday: groupKey === todayStr,
          events: [],
        });
      }

      mapByDate.get(groupKey)!.events.push({
        event: ev,
        formattedTime: `${startH}:${startM} - ${endH}:${endM}`,
        durationMinutes,
        isConflict: conflictSet.has(ev.id),
      });
    }

    return Array.from(mapByDate.values());
  });

  onEventClick(calEvent: CalendarEvent): void {
    this.eventClicked.emit(calEvent);
  }

  onCreateClick(): void {
    this.createClicked.emit();
  }
}
