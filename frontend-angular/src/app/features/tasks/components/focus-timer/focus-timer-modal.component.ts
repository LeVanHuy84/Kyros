import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
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
  selector: 'app-focus-timer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, ButtonComponent],
  templateUrl: './focus-timer-modal.component.html',
  styleUrl: './focus-timer-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusTimerModalComponent implements OnDestroy {
  readonly tasksService = inject(TasksService);
  readonly languageService = inject(LanguageService);
  private readonly toastService = inject(ToastService);

  isOpen = input<boolean>(false);
  task = input<TaskItem | null>(null);
  closeModal = output<void>();

  readonly totalSeconds = signal<number>(25 * 60); // 25 minutes default
  readonly secondsLeft = signal<number>(25 * 60);
  readonly isRunning = signal<boolean>(false);
  readonly notes = signal<string>('');

  private intervalId: any = null;

  readonly minutesDisplay = computed(() => {
    const mins = Math.floor(this.secondsLeft() / 60);
    return String(mins).padStart(2, '0');
  });

  readonly secondsDisplay = computed(() => {
    const secs = this.secondsLeft() % 60;
    return String(secs).padStart(2, '0');
  });

  readonly progressPercentage = computed(() => {
    const total = this.totalSeconds();
    if (total <= 0) return 100;
    return ((total - this.secondsLeft()) / total) * 100;
  });

  readonly strokeDashoffset = computed(() => {
    const circumference = 2 * Math.PI * 88; // radius = 88
    return circumference - (this.progressPercentage() / 100) * circumference;
  });

  setDuration(minutes: number): void {
    if (this.isRunning()) return;
    const total = minutes * 60;
    this.totalSeconds.set(total);
    this.secondsLeft.set(total);
  }

  startTimer(): void {
    const t = this.task();
    if (!t) return;

    if (!this.isRunning()) {
      this.isRunning.set(true);
      this.tasksService.startTimer(t.id).subscribe();

      this.intervalId = setInterval(() => {
        if (this.secondsLeft() > 0) {
          this.secondsLeft.update((s) => s - 1);
        } else {
          this.onTimerComplete();
        }
      }, 1000);
    }
  }

  pauseTimer(): void {
    if (this.isRunning()) {
      this.isRunning.set(false);
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  resetTimer(): void {
    this.pauseTimer();
    this.secondsLeft.set(this.totalSeconds());
  }

  finishSession(): void {
    const t = this.task();
    if (!t) return;

    this.pauseTimer();
    const elapsedSeconds = this.totalSeconds() - this.secondsLeft();
    const elapsedMinutes = Math.round(elapsedSeconds / 60);
    const duration =
      elapsedMinutes >= 1 ? elapsedMinutes : Math.round(this.totalSeconds() / 60);

    this.tasksService.logCompletedSession(t.id, duration, this.notes()).subscribe({
      next: () => {
        this.toastService.success(`Đã lưu phiên tập trung (${duration} phút) vào hệ thống!`);
        this.resetTimer();
        this.notes.set('');
        this.closeModal.emit();
      },
      error: () => {
        this.toastService.error('Không thể lưu phiên làm việc.');
      },
    });
  }

  private onTimerComplete(): void {
    this.pauseTimer();
    this.playChime();
    const duration = Math.round(this.totalSeconds() / 60);
    this.toastService.success(`🎉 Hoàn thành phiên tập trung Pomodoro ${duration} phút!`);
  }

  private playChime(): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio context might be restricted before user interaction
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
