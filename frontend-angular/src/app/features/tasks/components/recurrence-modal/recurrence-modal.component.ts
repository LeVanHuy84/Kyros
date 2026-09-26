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
import { FormsModule } from '@angular/forms';
import { TaskItem } from '../../models/task.models';
import { TasksService } from '../../services/tasks.service';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ToastService } from '@shared/components/toast/toast.service';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-recurrence-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, ButtonComponent],
  templateUrl: './recurrence-modal.component.html',
  styleUrl: './recurrence-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecurrenceModalComponent {
  readonly tasksService = inject(TasksService);
  readonly languageService = inject(LanguageService);
  private readonly toastService = inject(ToastService);

  isOpen = input<boolean>(false);
  task = input<TaskItem | null>(null);
  closeModal = output<void>();

  readonly pattern = signal<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  readonly interval = signal<number>(1);
  readonly currentStatus = signal<'Active' | 'Paused' | 'Stopped' | null>(null);

  constructor() {
    effect(() => {
      const t = this.task();
      if (t && this.isOpen()) {
        this.tasksService.getRecurrence(t.id).subscribe((rec) => {
          if (rec) {
            this.pattern.set(rec.pattern || 'DAILY');
            this.interval.set(rec.interval || 1);
            this.currentStatus.set(rec.recurrenceStatus || 'Active');
          } else {
            this.pattern.set('DAILY');
            this.interval.set(1);
            this.currentStatus.set(null);
          }
        });
      }
    }, { allowSignalWrites: true });
  }

  setPattern(p: 'DAILY' | 'WEEKLY' | 'MONTHLY'): void {
    this.pattern.set(p);
  }

  saveRecurrence(): void {
    const t = this.task();
    if (!t) return;

    this.tasksService
      .configureRecurrence(t.id, {
        pattern: this.pattern(),
        interval: this.interval() || 1,
      })
      .subscribe({
        next: (rec) => {
          this.currentStatus.set(rec.recurrenceStatus);
          this.toastService.success('Đã thiết lập chu kỳ lặp lại thành công!');
          this.closeModal.emit();
        },
        error: () => this.toastService.error('Không thể thiết lập chu kỳ lặp lại.'),
      });
  }

  pauseRecurrence(): void {
    const t = this.task();
    if (!t) return;

    this.tasksService.pauseRecurrence(t.id).subscribe({
      next: (rec) => {
        this.currentStatus.set(rec.recurrenceStatus);
        this.toastService.success('Đã tạm dừng chu kỳ lặp lại.');
      },
    });
  }

  resumeRecurrence(): void {
    const t = this.task();
    if (!t) return;

    this.tasksService.resumeRecurrence(t.id).subscribe({
      next: (rec) => {
        this.currentStatus.set(rec.recurrenceStatus);
        this.toastService.success('Đã tiếp tục chu kỳ lặp lại.');
      },
    });
  }

  stopRecurrence(): void {
    const t = this.task();
    if (!t) return;

    this.tasksService.stopRecurrence(t.id).subscribe({
      next: (rec) => {
        this.currentStatus.set(rec.recurrenceStatus);
        this.toastService.success('Đã hủy bỏ chu kỳ lặp lại.');
        this.closeModal.emit();
      },
    });
  }
}
