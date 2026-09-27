import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { LanguageService } from '@core/services/language.service';
import { ToastService } from '@shared/components/toast/toast.service';
import { CalendarService } from '../../services/calendar.service';
import { EventConflict } from '../../models/calendar.models';

@Component({
  selector: 'app-conflict-resolver-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent, AppIconComponent],
  templateUrl: './conflict-resolver-modal.component.html',
  styleUrl: './conflict-resolver-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConflictResolverModalComponent {
  readonly calendarService = inject(CalendarService);
  readonly languageService = inject(LanguageService);
  private readonly toast = inject(ToastService);

  isOpen = input.required<boolean>();
  close = output<void>();
  resolved = output<void>();

  onApplyResolution(): void {
    this.calendarService.resolveConflicts(7).subscribe({
      next: () => {
        this.toast.success(
          this.languageService.t().calendar.conflictResolverModal.noConflicts
        );
        this.resolved.emit();
        this.close.emit();
      },
      error: () => {
        this.toast.error(this.languageService.t().common.error);
      },
    });
  }

  formatTimeRange(startIso: string, endIso: string): string {
    const s = new Date(startIso);
    const e = new Date(endIso);
    const dateStr = s.toLocaleDateString(
      this.languageService.currentLanguage() === 'vi' ? 'vi-VN' : 'en-US',
      { weekday: 'short', month: 'numeric', day: 'numeric' }
    );
    const sH = s.getHours().toString().padStart(2, '0');
    const sM = s.getMinutes().toString().padStart(2, '0');
    const eH = e.getHours().toString().padStart(2, '0');
    const eM = e.getMinutes().toString().padStart(2, '0');
    return `${dateStr}, ${sH}:${sM} - ${eH}:${eM}`;
  }
}
