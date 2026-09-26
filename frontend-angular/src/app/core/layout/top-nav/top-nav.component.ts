import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '@core/services/theme.service';
import { AuthService } from '@core/auth/services/auth.service';
import { LanguageService } from '@core/services/language.service';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { TenantSelectorComponent } from '@shared/components/tenant-selector/tenant-selector.component';
import { NotificationDropdownComponent } from './notification-dropdown/notification-dropdown.component';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [
    CommonModule,
    AvatarComponent,
    AppIconComponent,
    TenantSelectorComponent,
    NotificationDropdownComponent,
  ],
  templateUrl: './top-nav.component.html',
  styleUrl: './top-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavComponent {
  readonly themeService = inject(ThemeService);
  readonly authService = inject(AuthService);
  readonly languageService = inject(LanguageService);
  private readonly elementRef = inject(ElementRef);

  readonly isUserMenuOpen = signal<boolean>(false);

  toggleSidebar = output<void>();
  searchClicked = output<void>();

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isUserMenuOpen.set(false);
    }
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update((v) => !v);
  }

  handleLogout(): void {
    this.isUserMenuOpen.set(false);
    this.authService.logout();
  }
}
