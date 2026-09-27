import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { LanguageService } from '@core/services/language.service';
import { UserPreferencesService } from '../../services/user-preferences.service';
import { UserPreferences } from '../../models/settings.models';

export const COMMON_TIMEZONES = [
  'Asia/Ho_Chi_Minh',
  'UTC',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
];

@Component({
  selector: 'app-calendar-settings-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  templateUrl: './calendar-settings-panel.component.html',
  styleUrl: './calendar-settings-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarSettingsPanelComponent implements OnInit {
  readonly languageService = inject(LanguageService);
  readonly preferencesService = inject(UserPreferencesService);

  readonly timezones = COMMON_TIMEZONES;
  readonly leadTimeOptions = [5, 10, 15, 30, 45, 60, 120];

  readonly timezone = signal<string>('Asia/Ho_Chi_Minh');
  readonly defaultPriority = signal<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  readonly preventCalendarOverlap = signal<boolean>(false);
  readonly leadTimeMinutes = signal<number>(15);

  readonly feedbackMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  ngOnInit(): void {
    this.preferencesService.fetchPreferences().subscribe((prefs) => {
      this.syncFromPreferences(prefs);
    });
  }

  private syncFromPreferences(prefs: UserPreferences): void {
    this.timezone.set(prefs.timezone || 'Asia/Ho_Chi_Minh');
    this.defaultPriority.set(prefs.defaultPriority || 'Medium');
    this.preventCalendarOverlap.set(!!prefs.preventCalendarOverlap);
    this.leadTimeMinutes.set(prefs.leadTimeMinutes || 15);
  }

  handleSave(): void {
    const payload: UserPreferences = {
      timezone: this.timezone(),
      defaultPriority: this.defaultPriority(),
      preventCalendarOverlap: this.preventCalendarOverlap(),
      leadTimeMinutes: this.leadTimeMinutes(),
    };

    this.preferencesService.updatePreferences(payload).subscribe((success) => {
      if (success) {
        this.showFeedback('success', this.languageService.t().settings.calendar.savedSuccess);
      } else {
        this.showFeedback('error', 'Cập nhật thất bại. Vui lòng thử lại!');
      }
    });
  }

  handleReset(): void {
    this.preferencesService.resetPreferences().subscribe((success) => {
      if (success) {
        this.syncFromPreferences(this.preferencesService.preferences());
        this.showFeedback('success', this.languageService.t().settings.calendar.resetSuccess);
      }
    });
  }

  getPriorityLabel(pri: string): string {
    const t = this.languageService.t().tasks;
    if (pri === 'Low') return t.low;
    if (pri === 'Medium') return t.medium;
    if (pri === 'High') return t.high;
    return pri;
  }

  private showFeedback(type: 'success' | 'error', text: string): void {
    this.feedbackMessage.set({ type, text });
    setTimeout(() => {
      if (this.feedbackMessage()?.text === text) {
        this.feedbackMessage.set(null);
      }
    }, 4000);
  }
}
