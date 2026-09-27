import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TasksService } from '../../services/tasks.service';
import { TaskItem, TaskPriority, TaskViewMode } from '../../models/task.models';
import { TaskListComponent } from '../../components/task-list/task-list.component';
import { TaskBoardComponent } from '../../components/task-board/task-board.component';
import { TaskFormModalComponent } from '../../components/task-form-modal/task-form-modal.component';
import { FocusTimerModalComponent } from '../../components/focus-timer/focus-timer-modal.component';
import { RecurrenceModalComponent } from '../../components/recurrence-modal/recurrence-modal.component';
import { ProductivityMetricsModalComponent } from '../../components/productivity-metrics/productivity-metrics-modal.component';
import { TagManagerModalComponent } from '../../components/tag-manager/tag-manager-modal.component';
import { TrashRecoveryDrawerComponent } from '../../components/trash-recovery-drawer/trash-recovery-drawer.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TaskListComponent,
    TaskBoardComponent,
    TaskFormModalComponent,
    FocusTimerModalComponent,
    RecurrenceModalComponent,
    ProductivityMetricsModalComponent,
    TagManagerModalComponent,
    TrashRecoveryDrawerComponent,
    AppIconComponent,
    ButtonComponent,
  ],
  templateUrl: './tasks-page.component.html',
  styleUrl: './tasks-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksPageComponent implements OnInit {
  readonly tasksService = inject(TasksService);
  readonly languageService = inject(LanguageService);
  private readonly elementRef = inject(ElementRef);

  // Modals state
  readonly isFormModalOpen = signal<boolean>(false);
  readonly selectedTaskForEdit = signal<TaskItem | null>(null);
  readonly defaultPriorityForNew = signal<TaskPriority>('MEDIUM');

  readonly isTimerModalOpen = signal<boolean>(false);
  readonly selectedTaskForTimer = signal<TaskItem | null>(null);

  readonly isRecurrenceModalOpen = signal<boolean>(false);
  readonly selectedTaskForRecurrence = signal<TaskItem | null>(null);

  readonly isProductivityModalOpen = signal<boolean>(false);
  readonly isTagManagerModalOpen = signal<boolean>(false);
  readonly isTrashDrawerOpen = signal<boolean>(false);
  readonly isPriorityDropdownOpen = signal<boolean>(false);

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isPriorityDropdownOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.tasksService.loadTasks().subscribe();
    this.tasksService.loadTags().subscribe();
    this.tasksService.loadDeletedTasks().subscribe();
  }

  // Modal actions
  openCreateTaskModal(priority: string = 'MEDIUM'): void {
    this.selectedTaskForEdit.set(null);
    let p: TaskPriority = 'MEDIUM';
    if (priority === 'HIGH') p = 'HIGH';
    else if (priority === 'LOW') p = 'LOW';
    this.defaultPriorityForNew.set(p);
    this.isFormModalOpen.set(true);
  }

  openEditTaskModal(task: TaskItem): void {
    this.selectedTaskForEdit.set(task);
    this.isFormModalOpen.set(true);
  }

  openFocusTimer(task: TaskItem): void {
    this.selectedTaskForTimer.set(task);
    this.isTimerModalOpen.set(true);
  }

  openRecurrenceModal(task: TaskItem): void {
    this.selectedTaskForRecurrence.set(task);
    this.isRecurrenceModalOpen.set(true);
  }

  // Filter setters
  onSearchChange(value: string): void {
    this.tasksService.setSearch(value);
  }

  setViewMode(mode: TaskViewMode): void {
    this.tasksService.setViewMode(mode);
  }

  setStatusFilter(status: 'ALL' | 'ACTIVE' | 'COMPLETED'): void {
    this.tasksService.setStatusFilter(status);
  }

  setPriorityFilter(priority: 'ALL' | TaskPriority): void {
    this.tasksService.setPriorityFilter(priority);
  }

  togglePriorityDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isPriorityDropdownOpen.update((v) => !v);
  }

  selectPriority(priority: 'ALL' | TaskPriority, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.tasksService.setPriorityFilter(priority);
    this.isPriorityDropdownOpen.set(false);
  }

  getPriorityLabel(priority: 'ALL' | TaskPriority): string {
    switch (priority) {
      case 'HIGH':
        return this.languageService.t().tasks.high;
      case 'MEDIUM':
        return this.languageService.t().tasks.medium;
      case 'LOW':
        return this.languageService.t().tasks.low;
      default:
        return this.languageService.t().tasks.all;
    }
  }

  onTagClicked(tag: string): void {
    this.tasksService.setTagFilter(tag);
  }

  clearTagFilter(): void {
    this.tasksService.setTagFilter(null);
  }
}
