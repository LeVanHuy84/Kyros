import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AppIconComponent, AppIconName } from '@shared/components/icon/icon.component';
import { AiConfigPanelComponent } from '../components/ai-config-panel/ai-config-panel.component';
import { CalendarSettingsPanelComponent } from '../components/calendar-settings-panel/calendar-settings-panel.component';
import { NotificationSettingsPanelComponent } from '../components/notification-settings-panel/notification-settings-panel.component';
import { PreferencesPanelComponent } from '../components/preferences-panel/preferences-panel.component';
import { LanguageService } from '@core/services/language.service';

export type SettingsSubTab = 'ai' | 'calendar' | 'notif' | 'vault' | 'pref';

export interface SettingsTabItem {
  id: SettingsSubTab;
  label: string;
  icon: AppIconName;
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    AppIconComponent,
    AiConfigPanelComponent,
    CalendarSettingsPanelComponent,
    NotificationSettingsPanelComponent,
    PreferencesPanelComponent,
  ],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly languageService = inject(LanguageService);

  readonly activeSubTab = signal<SettingsSubTab>('ai');

  readonly tabs = computed<SettingsTabItem[]>(() => {
    const s = this.languageService.t().settings;
    return [
      { id: 'ai', label: s.tabs.aiProvider, icon: 'brain' },
      { id: 'calendar', label: s.tabs.calendar, icon: 'calendar' },
      { id: 'notif', label: s.tabs.notifications, icon: 'bell' },
      { id: 'pref', label: s.tabs.general, icon: 'settings' },
      { id: 'vault', label: s.tabs.vault, icon: 'lock' },
    ];
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const tabParam = params.get('tab') as SettingsSubTab | null;
      if (tabParam) {
        this.activeSubTab.set(tabParam);
      }
    });
  }

  selectTab(tab: SettingsSubTab): void {
    this.activeSubTab.set(tab);
  }
}
