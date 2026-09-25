import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { KyrosLogoComponent } from '@shared/components/logo/kyros-logo.component';
import { AppIconComponent, AppIconName } from '@shared/components/icon/icon.component';
import { LanguageService } from '@core/services/language.service';

export interface NavItem {
  label: string;
  route: string;
  iconName: AppIconName;
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, KyrosLogoComponent, AppIconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  collapsed = input<boolean>(false);

  readonly languageService = inject(LanguageService);

  /**
   * Computed reactive navigation menu that dynamically translates upon language changes.
   */
  readonly navItems = computed<NavItem[]>(() => {
    const t = this.languageService.t().nav;
    return [
      { label: t.agent, route: '/agent', iconName: 'sparkles', badge: t.liveBadge },
      { label: t.tasks, route: '/tasks', iconName: 'check-square' },
      { label: t.calendar, route: '/calendar', iconName: 'calendar' },
      { label: t.notes, route: '/notes', iconName: 'file-text' },
      { label: t.memory, route: '/memory', iconName: 'brain' },
      { label: t.settings, route: '/settings', iconName: 'settings' },
    ];
  });
}
