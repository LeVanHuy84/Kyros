import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksService } from '../../services/tasks.service';
import { TaskItem } from '../../models/task.models';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ToastService } from '@shared/components/toast/toast.service';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-trash-recovery-drawer',
  standalone: true,
  imports: [CommonModule, AppIconComponent, ButtonComponent],
  templateUrl: './trash-recovery-drawer.component.html',
  styleUrl: './trash-recovery-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrashRecoveryDrawerComponent {
  readonly tasksService = inject(TasksService);
  readonly languageService = inject(LanguageService);
  private readonly toastService = inject(ToastService);

  isOpen = input<boolean>(false);
  closeDrawer = output<void>();

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.tasksService.loadDeletedTasks().subscribe();
      }
    });
  }

  recoverTask(task: TaskItem): void {
    this.tasksService.recoverTask(task.id).subscribe({
      next: () => {
        this.toastService.success(`Đã khôi phục nhiệm vụ "${task.title}"!`);
      },
      error: () => {
        this.toastService.error('Không thể khôi phục nhiệm vụ.');
      },
    });
  }

  getRemainingRecoveryTime(task: TaskItem): string {
    const deletedTime = task.deletedAt ? new Date(task.deletedAt).getTime() : new Date(task.updatedAt).getTime();
    const windowMs = 2 * 60 * 60 * 1000; // 2 hours
    const expiresAt = deletedTime + windowMs;
    const remainingMs = expiresAt - Date.now();

    if (remainingMs <= 0) {
      return 'Sắp hết hạn';
    }

    const remainingMins = Math.floor(remainingMs / (60 * 1000));
    if (remainingMins > 60) {
      const hours = Math.floor(remainingMins / 60);
      const mins = remainingMins % 60;
      return `Còn ${hours} giờ ${mins} phút`;
    }
    return `Còn ${remainingMins} phút`;
  }
}
