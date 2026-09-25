import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@shared/components/button/button.component';
import { MarkdownViewerComponent } from '@shared/components/markdown/markdown-viewer.component';
import { ToastService } from '@shared/components/toast/toast.service';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { KyrosLogoComponent } from '@shared/components/logo/kyros-logo.component';

@Component({
  selector: 'app-agent-placeholder',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    MarkdownViewerComponent,
    AppIconComponent,
    KyrosLogoComponent,
  ],
  templateUrl: './agent-placeholder.component.html',
  styleUrl: './agent-placeholder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentPlaceholderComponent {
  private readonly toastService = inject(ToastService);

  testToast(): void {
    this.toastService.success(
      'Hệ thống tệp tin .ts, .html, .scss đã được tách biệt hoàn hảo theo chuẩn kiến trúc!',
      'Chuẩn hóa cấu trúc'
    );
  }
}
