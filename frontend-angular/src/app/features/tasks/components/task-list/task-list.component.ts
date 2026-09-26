import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TasksService } from '../../services/tasks.service';
import { TaskItem } from '../../models/task.models';
import { TaskCardComponent } from '../task-card/task-card.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, TaskCardComponent, AppIconComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {
  readonly tasksService = inject(TasksService);
  readonly languageService = inject(LanguageService);

  editTask = output<TaskItem>();
  openTimer = output<TaskItem>();
  openRecurrence = output<TaskItem>();
  tagClicked = output<string>();
  createTask = output<void>();
}
