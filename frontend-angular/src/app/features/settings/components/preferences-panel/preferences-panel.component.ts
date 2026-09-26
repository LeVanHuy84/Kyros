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
import { UserPreferencesService } from '../../services/user-preferences.service';
import { UserPreferences } from '../../models/settings.models';
import { LanguageService } from '@core/services/language.service';

export interface TimezoneOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-preferences-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  templateUrl: './preferences-panel.component.html',
  styleUrl: './preferences-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferencesPanelComponent implements OnInit {
  readonly languageService = inject(LanguageService);
  readonly preferencesService = inject(UserPreferencesService);

  readonly aiTone = signal<'concise' | 'balanced' | 'detailed'>('balanced');
  readonly timezone = signal<string>('Asia/Ho_Chi_Minh');
  readonly workStartTime = signal<string>('08:30');
  readonly workEndTime = signal<string>('18:00');
  readonly preventCalendarOverlap = signal<boolean>(true);
  readonly leadTimeMinutes = signal<number>(15);
  readonly defaultPriority = signal<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');

  readonly dndEnabled = signal<boolean>(false);
  readonly quietHoursEnabled = signal<boolean>(true);
  readonly quietHoursStart = signal<string>('22:00');
  readonly quietHoursEnd = signal<string>('07:00');
  readonly soundEnabled = signal<boolean>(true);

  readonly feedbackMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  readonly timezoneOptions: TimezoneOption[] = [
    { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (GMT+7 - Vietnam, Bangkok, Jakarta)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8 - Singapore, Kuala Lumpur)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9 - Tokyo, Seoul)' },
    { value: 'UTC', label: 'UTC (GMT+0 - Universal Coordinated Time)' },
    { value: 'Europe/London', label: 'Europe/London (GMT+1 - London, Dublin)' },
    { value: 'America/New_York', label: 'America/New_York (GMT-4 - New York, Washington)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (GMT-7 - San Francisco, LA)' },
  ];

  ngOnInit(): void {
    this.preferencesService.fetchPreferences().subscribe((prefs) => {
      this.syncFromPreferences(prefs);
    });
    this.loadLocalPreferences();
  }

  private syncFromPreferences(prefs: UserPreferences): void {
    this.timezone.set(prefs.timezone || 'Asia/Ho_Chi_Minh');
    this.defaultPriority.set(prefs.defaultPriority || 'Medium');
    this.preventCalendarOverlap.set(!!prefs.preventCalendarOverlap);
    this.leadTimeMinutes.set(prefs.leadTimeMinutes || 15);
  }

  private loadLocalPreferences(): void {
    try {
      const savedTone = localStorage.getItem('kyros_pref_ai_tone');
      if (savedTone === 'concise' || savedTone === 'balanced' || savedTone === 'detailed') {
        this.aiTone.set(savedTone);
      }
      const savedDnd = localStorage.getItem('kyros_pref_dnd');
      if (savedDnd !== null) this.dndEnabled.set(savedDnd === 'true');

      const savedSound = localStorage.getItem('kyros_pref_sound');
      if (savedSound !== null) this.soundEnabled.set(savedSound === 'true');
    } catch {
      // Ignore
    }
  }

  setAiTone(tone: 'concise' | 'balanced' | 'detailed'): void {
    this.aiTone.set(tone);
    try {
      localStorage.setItem('kyros_pref_ai_tone', tone);
    } catch {
      // Ignore
    }
  }

  toggleDnd(): void {
    const next = !this.dndEnabled();
    this.dndEnabled.set(next);
    try {
      localStorage.setItem('kyros_pref_dnd', String(next));
    } catch {
      // Ignore
    }
  }

  toggleSound(): void {
    const next = !this.soundEnabled();
    this.soundEnabled.set(next);
    try {
      localStorage.setItem('kyros_pref_sound', String(next));
    } catch {
      // Ignore
    }
  }

  handleSave(): void {
    const payload: UserPreferences = {
      timezone: this.timezone(),
      defaultPriority: this.defaultPriority(),
      preventCalendarOverlap: this.preventCalendarOverlap(),
      leadTimeMinutes: Number(this.leadTimeMinutes()) || 15,
    };

    this.preferencesService.updatePreferences(payload).subscribe((success) => {
      if (success) {
        this.showFeedback('success', this.languageService.t().settings.preferences.savedSuccess);
      } else {
        this.showFeedback('error', 'Cập nhật cài đặt thất bại. Vui lòng thử lại!');
      }
    });
  }

  handleReset(): void {
    this.preferencesService.resetPreferences().subscribe((success) => {
      if (success) {
        this.syncFromPreferences(this.preferencesService.preferences());
        this.aiTone.set('balanced');
        this.dndEnabled.set(false);
        this.soundEnabled.set(true);
        this.showFeedback('success', this.languageService.t().settings.preferences.resetSuccess);
      }
    });
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
