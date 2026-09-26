import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ExecutiveBriefingService } from '../../services/executive-briefing.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-executive-briefing-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent, AppIconComponent],
  templateUrl: './executive-briefing-modal.component.html',
  styleUrl: './executive-briefing-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutiveBriefingModalComponent implements OnInit {
  readonly briefingService = inject(ExecutiveBriefingService);
  private readonly toastService = inject(ToastService);
  readonly languageService = inject(LanguageService);

  isOpen = input<boolean>(false);
  closeModal = output<void>();

  readonly copied = signal<boolean>(false);

  ngOnInit(): void {
    if (this.isOpen()) {
      this.loadBriefing();
    }
  }

  loadBriefing(): void {
    this.briefingService.getTodayBriefing().subscribe({
      error: () => {
        // Fallback: auto-generate if today briefing is not created yet
        this.generateFresh();
      },
    });
  }

  generateFresh(): void {
    this.briefingService.generateBriefing().subscribe({
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

    const lines = [
      `=== BẢN TIN ĐIỀU HÀNH HÀNG NGÀY - KYROS AI ===`,
      `Thời gian: ${new Date().toLocaleDateString('vi-VN')}`,
      ``,
      b.summary ? `TỔNG QUAN: ${b.summary}\n` : '',
      b.topPriorities?.length ? `NHIỆM VỤ ƯU TIÊN:\n${b.topPriorities.map((p) => `- ${p}`).join('\n')}\n` : '',
      b.scheduleOverview?.length ? `LỊCH TRÌNH:\n${b.scheduleOverview.map((s) => `- ${s}`).join('\n')}\n` : '',
      b.aiRecommendations?.length ? `GỢI Ý TỪ AI:\n${b.aiRecommendations.map((r) => `- ${r}`).join('\n')}` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
      this.toastService.success('Đã sao chép bản tin vào Clipboard', 'Đã chép');
    });
  }
}
