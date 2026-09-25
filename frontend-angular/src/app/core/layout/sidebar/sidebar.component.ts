import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { KyrosLogoComponent } from '@shared/components/logo/kyros-logo.component';
import { AppIconComponent, AppIconName } from '@shared/components/icon/icon.component';

interface NavItem {
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

  readonly navItems: NavItem[] = [
    { label: 'Trợ lý AI (Agent)', route: '/agent', iconName: 'sparkles', badge: 'Live' },
    { label: 'Công việc (Tasks)', route: '/tasks', iconName: 'check-square' },
    { label: 'Lịch biểu (Calendar)', route: '/calendar', iconName: 'calendar' },
    { label: 'Ghi chú (Notes)', route: '/notes', iconName: 'file-text' },
    { label: 'Ký ức AI (Memory)', route: '/memory', iconName: 'brain' },
    { label: 'Cài đặt (Settings)', route: '/settings', iconName: 'settings' },
  ];
}
