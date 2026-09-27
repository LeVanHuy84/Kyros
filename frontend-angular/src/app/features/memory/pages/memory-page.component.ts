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
import { MemoryVaultPanelComponent } from '../components/memory-vault/memory-vault-panel.component';
import { ConversationsDirectoryPanelComponent } from '../components/conversations-directory/conversations-directory-panel.component';
import { LanguageService } from '@core/services/language.service';

export type MemoryTab = 'vault' | 'audit';

export interface MemoryTabItem {
  id: MemoryTab;
  label: string;
  icon: AppIconName;
}

@Component({
  selector: 'app-memory-page',
  standalone: true,
  imports: [
    CommonModule,
    AppIconComponent,
    MemoryVaultPanelComponent,
    ConversationsDirectoryPanelComponent,
  ],
  templateUrl: './memory-page.component.html',
  styleUrl: './memory-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemoryPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly languageService = inject(LanguageService);

  readonly activeTab = signal<MemoryTab>('vault');

  readonly tabs = computed<MemoryTabItem[]>(() => {
    const t = this.languageService.t().memory.tabs;
    return [
      { id: 'vault', label: t.vault, icon: 'brain' },
      { id: 'audit', label: t.audit, icon: 'message-square' },
    ];
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const tabParam = params.get('tab') as MemoryTab | null;
      if (tabParam === 'vault' || tabParam === 'audit') {
        this.activeTab.set(tabParam);
      }
    });
  }

  selectTab(tab: MemoryTab): void {
    this.activeTab.set(tab);
  }
}
