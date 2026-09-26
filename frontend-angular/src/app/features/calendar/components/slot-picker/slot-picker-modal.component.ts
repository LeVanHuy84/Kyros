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
import { CalendarService } from '../../services/calendar.service';
import { TimeSlot } from '../../models/calendar.models';

@Component({
  selector: 'app-slot-picker-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    AppIconComponent,
  ],
  templateUrl: './slot-picker-modal.component.html',
  styleUrl: './slot-picker-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotPickerModalComponent {
  readonly calendarService = inject(CalendarService);
  readonly languageService = inject(LanguageService);

  isOpen = input.required<boolean>();
  close = output<void>();
  slotSelected = output<{ startTime: string; endTime: string }>();

  // Search parameters
  selectedHorizon = signal<'today' | 'tomorrow' | 'week'>('today');
  selectedDuration = signal<number>(30);
  workingHoursStart = signal<string>('09:00');
  workingHoursEnd = signal<string>('17:00');

  // Search results
  isSearching = signal<boolean>(false);
  hasSearched = signal<boolean>(false);
  availableSlots = signal<TimeSlot[]>([]);

  searchSlots(): void {
    this.isSearching.set(true);
    const now = new Date();
    let start: Date;
    let end: Date;
    let maxResults = 20;

    const horizon = this.selectedHorizon();
    if (horizon === 'today') {
      const m = now.getMinutes();
      const roundedM = Math.ceil(m / 15) * 15;
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        roundedM,
        0
      );
      end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59
      );
    } else if (horizon === 'tomorrow') {
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        8,
        0,
        0
      );
      end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        23,
        59,
        59
      );
    } else {
      // 7 days ahead
      const m = now.getMinutes();
      const roundedM = Math.ceil(m / 15) * 15;
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        roundedM,
        0
      );
      end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 7,
        23,
        59,
        59
      );
      maxResults = 30;
    }

    this.calendarService
      .discoverSlots(
        start,
        end,
        this.selectedDuration(),
        this.workingHoursStart(),
        this.workingHoursEnd(),
        maxResults
      )
      .subscribe({
        next: (slots) => {
          this.availableSlots.set(slots);
          this.isSearching.set(false);
          this.hasSearched.set(true);
        },
        error: () => {
          this.availableSlots.set([]);
          this.isSearching.set(false);
          this.hasSearched.set(true);
        },
      });
  }

  onSelectSlot(slot: TimeSlot): void {
    this.slotSelected.emit({
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
    this.close.emit();
  }

  formatSlotDate(isoStr: string): string {
    const d = new Date(isoStr);
    return d.toLocaleDateString(
      this.languageService.currentLanguage() === 'vi' ? 'vi-VN' : 'en-US',
      { weekday: 'short', month: 'numeric', day: 'numeric' }
    );
  }

  formatSlotTime(isoStr: string): string {
    const d = new Date(isoStr);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}
