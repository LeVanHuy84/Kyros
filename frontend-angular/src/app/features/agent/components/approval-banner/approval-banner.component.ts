import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PendingApprovalData } from '../../models/agent.models';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-approval-banner',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  templateUrl: './approval-banner.component.html',
  styleUrl: './approval-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApprovalBannerComponent {
  readonly languageService = inject(LanguageService);

  pendingApproval = input<PendingApprovalData | null>(null);
  approve = output<void>();
  reject = output<void>();
}
