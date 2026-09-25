import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '@core/services/theme.service';
import { WorkspaceContextService } from '@core/services/workspace-context.service';
import { LanguageService } from '@core/services/language.service';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, AvatarComponent, AppIconComponent],
  templateUrl: './top-nav.component.html',
  styleUrl: './top-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNavComponent {
  readonly themeService = inject(ThemeService);
  readonly workspaceService = inject(WorkspaceContextService);
  readonly languageService = inject(LanguageService);

  toggleSidebar = output<void>();
  searchClicked = output<void>();
}
