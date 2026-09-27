import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService } from '../../services/calendar.service';
import { CalendarEvent, CalendarViewMode } from '../../models/calendar.models';
import { MonthViewComponent } from './month-view.component';
import { WeekViewComponent } from './week-view.component';
import { DayViewComponent } from './day-view.component';
import { AgendaViewComponent } from './agenda-view.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-calendar-grid',
  standalone: true,
  imports: [
    CommonModule,
    MonthViewComponent,
    WeekViewComponent,
    DayViewComponent,
    AgendaViewComponent,
    AppIconComponent,
    ButtonComponent,
  ],
  templateUrl: './calendar-grid.component.html',
  styleUrl: './calendar-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarGridComponent {
  readonly calendarService = inject(CalendarService);
  readonly languageService = inject(LanguageService);

  eventSelected = output<CalendarEvent>();
  createAtDate = output<Date>();
  createAtSlot = output<{ date: Date; hour: number }>();
  openConflictResolver = output<void>();

  readonly periodTitle = computed<string>(() => {
    const sel = new Date(this.calendarService.selectedDate());
    const mode = this.calendarService.viewMode();
    const months = this.languageService.t().calendar.months;

    if (mode === 'month') {
      return `${months[sel.getMonth()]} ${sel.getFullYear()}`;
    }

    if (mode === 'week') {
      const dayOfWeek = (sel.getDay() + 6) % 7;
      const start = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() - dayOfWeek);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
      return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
    }

    if (mode === 'day') {
      const tWeek = this.languageService.t().calendar.fullWeekdays;
      const dayNames = [tWeek.mon, tWeek.tue, tWeek.wed, tWeek.thu, tWeek.fri, tWeek.sat, tWeek.sun];
      const dayOfWeek = (sel.getDay() + 6) % 7;
      return `${dayNames[dayOfWeek]}, ${sel.getDate()} ${months[sel.getMonth()]} ${sel.getFullYear()}`;
    }

    return `${months[sel.getMonth()]} ${sel.getFullYear()}`;
  });

  setViewMode(mode: CalendarViewMode): void {
    this.calendarService.setViewMode(mode);
  }

  onPrev(): void {
    this.calendarService.prevPeriod();
  }

  onNext(): void {
    this.calendarService.nextPeriod();
  }

  onToday(): void {
    this.calendarService.goToToday();
  }

  onEventClicked(event: CalendarEvent): void {
    this.eventSelected.emit(event);
  }

  onDayClicked(date: Date): void {
    this.createAtDate.emit(date);
  }

  onSlotClicked(slot: { date: Date; hour: number }): void {
    this.createAtSlot.emit(slot);
  }
}
