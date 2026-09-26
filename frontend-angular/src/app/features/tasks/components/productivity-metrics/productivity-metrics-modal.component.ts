import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksService } from '../../services/tasks.service';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-productivity-metrics-modal',
  standalone: true,
  imports: [CommonModule, AppIconComponent, ButtonComponent],
  templateUrl: './productivity-metrics-modal.component.html',
  styleUrl: './productivity-metrics-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductivityMetricsModalComponent implements OnInit {
  readonly tasksService = inject(TasksService);
  readonly languageService = inject(LanguageService);

  isOpen = input<boolean>(false);
  closeModal = output<void>();

  ngOnInit(): void {
    this.tasksService.loadProductivityStats().subscribe();
  }

  readonly formattedHours = computed(() => {
    const mins = this.tasksService.productivityStats()?.totalFocusedMinutes || 0;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours === 0) return `${remainingMins}m`;
    return `${hours}h ${remainingMins}m`;
  });

  readonly completionRate = computed(() => {
    const counts = this.tasksService.taskCounts();
    if (counts.total === 0) return 0;
    return Math.round((counts.completed / counts.total) * 100);
  });

  refresh(): void {
    this.tasksService.loadProductivityStats().subscribe();
  }
}
