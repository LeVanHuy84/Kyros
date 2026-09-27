import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-byok-warning-banner',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  templateUrl: './byok-warning-banner.component.html',
  styleUrl: './byok-warning-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ByokWarningBannerComponent {
  private readonly router = inject(Router);
  readonly languageService = inject(LanguageService);

  navigateToSettings(): void {
    this.router.navigate(['/settings'], { queryParams: { tab: 'ai' } });
  }
}
