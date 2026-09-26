import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService } from '../../services/calendar.service';
import { CalendarEvent } from '../../models/calendar.models';
import { CalendarGridComponent } from '../../components/calendar-grid/calendar-grid.component';
import { EventEditorModalComponent } from '../../components/event-editor/event-editor-modal.component';
import { EventDetailsDrawerComponent } from '../../components/event-drawer/event-details-drawer.component';
import { AutoScheduleModalComponent } from '../../components/auto-schedule/auto-schedule-modal.component';
import { SlotPickerModalComponent } from '../../components/slot-picker/slot-picker-modal.component';
import { ConflictResolverModalComponent } from '../../components/conflict-resolver/conflict-resolver-modal.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CalendarGridComponent,
    EventEditorModalComponent,
    EventDetailsDrawerComponent,
    AutoScheduleModalComponent,
    SlotPickerModalComponent,
    ConflictResolverModalComponent,
    AppIconComponent,
    ButtonComponent,
  ],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPageComponent implements OnInit {
  readonly calendarService = inject(CalendarService);
  readonly languageService = inject(LanguageService);

  // Modals & Drawer State Signals
  readonly isEditorModalOpen = signal<boolean>(false);
  readonly selectedEventForEdit = signal<CalendarEvent | null>(null);
  readonly initialDateForNew = signal<Date | null>(null);
  readonly initialHourForNew = signal<number | null>(null);

  readonly isDetailsDrawerOpen = signal<boolean>(false);
  readonly selectedEventForDrawer = signal<CalendarEvent | null>(null);

  readonly isAutoScheduleModalOpen = signal<boolean>(false);
  readonly isSlotPickerModalOpen = signal<boolean>(false);
  readonly isConflictResolverModalOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.calendarService.loadEvents().subscribe();
  }

  onSearch(query: string): void {
    this.calendarService.setSearchQuery(query);
  }

  // Open Actions
  openCreateEventModal(date?: Date, hour?: number): void {
    this.selectedEventForEdit.set(null);
    this.initialDateForNew.set(date || this.calendarService.selectedDate());
    this.initialHourForNew.set(hour !== undefined ? hour : 9);
    this.isEditorModalOpen.set(true);
  }

  openEventDetails(event: CalendarEvent): void {
    this.selectedEventForDrawer.set(event);
    this.isDetailsDrawerOpen.set(true);
  }

  openEditFromDrawer(event: CalendarEvent): void {
    this.selectedEventForEdit.set(event);
    this.initialDateForNew.set(null);
    this.initialHourForNew.set(null);
    this.isEditorModalOpen.set(true);
  }

  onSlotSelectedFromPicker(slot: { startTime: string; endTime: string }): void {
    const start = new Date(slot.startTime);
    this.openCreateEventModal(start, start.getHours());
  }

  onEventsUpdated(): void {
    this.calendarService.loadEvents().subscribe();
  }
}
