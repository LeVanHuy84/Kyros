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
import { LanguageService } from '@core/services/language.service';

export type SettingsSubTab = 'ai' | 'pref' | 'vault' | 'conv' | 'notif' | 'ws';

export interface SettingsTabItem {
  id: SettingsSubTab;
  label: string;
  icon: AppIconName;
}

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, AppIconComponent, AiConfigPanelComponent],
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
      { id: 'vault', label: s.tabs.vault, icon: 'lock' },
      { id: 'pref', label: s.tabs.general, icon: 'settings' },
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
