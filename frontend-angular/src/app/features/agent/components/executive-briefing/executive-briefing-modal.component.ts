import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { MarkdownViewerComponent } from '@shared/components/markdown/markdown-viewer.component';
import { ExecutiveBriefingService } from '../../services/executive-briefing.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { LanguageService } from '@core/services/language.service';
import { ExecutiveBriefingData } from '../../models/briefing.models';

@Component({
  selector: 'app-executive-briefing-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    ButtonComponent,
    AppIconComponent,
    MarkdownViewerComponent,
  ],
  templateUrl: './executive-briefing-modal.component.html',
  styleUrl: './executive-briefing-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutiveBriefingModalComponent {
  readonly briefingService = inject(ExecutiveBriefingService);
  private readonly toastService = inject(ToastService);
  readonly languageService = inject(LanguageService);

  isOpen = input<boolean>(false);
  closeModal = output<void>();

  readonly activeTab = signal<'MORNING' | 'EVENING'>('MORNING');
  readonly copied = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.loadBriefing(this.activeTab());
      }
    });
  }

  selectTab(tab: 'MORNING' | 'EVENING'): void {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    this.loadBriefing(tab);
  }

  hasContent(b: ExecutiveBriefingData | null): boolean {
    if (!b) return false;
    return Boolean(
      b.markdownContent?.trim() ||
        b.summary?.trim() ||
        (b.topPriorities && b.topPriorities.length > 0) ||
        (b.scheduleOverview && b.scheduleOverview.length > 0)
    );
  }

  loadBriefing(type: 'MORNING' | 'EVENING' = this.activeTab()): void {
    this.briefingService.getTodayBriefing(type).subscribe({
      error: () => {
        // Fallback: auto-generate if briefing is not created yet
        this.generateFresh(type);
      },
    });
  }

  generateFresh(type: 'MORNING' | 'EVENING' = this.activeTab()): void {
    this.briefingService.generateBriefing(type).subscribe({
      next: () => {
        this.toastService.success('Đã cập nhật bản tin điều hành mới nhất', 'Thành công');
      },
      error: () => {
        this.toastService.error('Không thể tổng hợp bản tin điều hành', 'Lỗi');
      },
    });
  }

  copyBriefing(): void {
    const b = this.briefingService.briefing();
    if (!b) return;

    const contentToCopy = b.markdownContent
      ? b.markdownContent
      : [
          `=== BẢN TIN ĐIỀU HÀNH HÀNG NGÀY - KYROS AI ===`,
          `Thời gian: ${new Date().toLocaleDateString('vi-VN')}`,
          ``,
          b.summary ? `TỔNG QUAN: ${b.summary}\n` : '',
          b.topPriorities?.length
            ? `NHIỆM VỤ ƯU TIÊN:\n${b.topPriorities.map((p) => `- ${p}`).join('\n')}\n`
            : '',
          b.scheduleOverview?.length
            ? `LỊCH TRÌNH:\n${b.scheduleOverview.map((s) => `- ${s}`).join('\n')}\n`
            : '',
          b.aiRecommendations?.length
            ? `GỢI Ý TỪ AI:\n${b.aiRecommendations.map((r) => `- ${r}`).join('\n')}`
            : '',
        ]
          .filter(Boolean)
          .join('\n');

    navigator.clipboard.writeText(contentToCopy).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
      this.toastService.success('Đã sao chép bản tin vào Clipboard', 'Đã chép');
    });
  }
}
