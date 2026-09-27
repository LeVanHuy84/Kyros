import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { TasksService } from '../../services/tasks.service';
import { TaskItem } from '../../models/task.models';
import { TaskCardComponent } from '../task-card/task-card.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [
    CommonModule,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    TaskCardComponent,
    AppIconComponent,
  ],
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardComponent {
  readonly tasksService = inject(TasksService);
  readonly languageService = inject(LanguageService);

  editTask = output<TaskItem>();
  openTimer = output<TaskItem>();
  openRecurrence = output<TaskItem>();
  tagClicked = output<string>();
  createTaskInColumn = output<string>();

  readonly standardTasks = computed(() => {
    return this.tasksService
      .filteredTasks()
      .filter((t) => t.lifecycleStatus !== 'Completed' && t.priority !== 'HIGH');
  });

  readonly highPriorityTasks = computed(() => {
    return this.tasksService
      .filteredTasks()
      .filter((t) => t.lifecycleStatus !== 'Completed' && t.priority === 'HIGH');
  });

  readonly completedTasks = computed(() => {
    return this.tasksService
      .filteredTasks()
      .filter((t) => t.lifecycleStatus === 'Completed');
  });

  onDrop(event: CdkDragDrop<TaskItem[]>, targetStatus: 'TODO' | 'HIGH' | 'COMPLETED'): void {
    const task: TaskItem = event.item.data;
    if (!task) return;

    if (targetStatus === 'COMPLETED') {
      if (task.lifecycleStatus !== 'Completed') {
        this.tasksService.completeTask(task.id).subscribe();
      }
    } else if (targetStatus === 'HIGH') {
      if (task.lifecycleStatus === 'Completed') {
        this.tasksService.reopenTask(task.id).subscribe(() => {
          this.tasksService.updateTask(task.id, { priority: 'HIGH' }).subscribe();
        });
      } else if (task.priority !== 'HIGH') {
        this.tasksService.updateTask(task.id, { priority: 'HIGH' }).subscribe();
      }
    } else if (targetStatus === 'TODO') {
      if (task.lifecycleStatus === 'Completed') {
        this.tasksService.reopenTask(task.id).subscribe();
      } else if (task.priority === 'HIGH') {
        this.tasksService.updateTask(task.id, { priority: 'MEDIUM' }).subscribe();
      }
    }
  }
}
