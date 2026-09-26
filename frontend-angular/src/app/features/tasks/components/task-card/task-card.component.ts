import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskItem, TaskPriority } from '../../models/task.models';
import { TasksService } from '../../services/tasks.service';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  readonly tasksService = inject(TasksService);
  readonly languageService = inject(LanguageService);
  private readonly elementRef = inject(ElementRef);

  task = input.required<TaskItem>();
  isCompact = input<boolean>(false);

  editTask = output<TaskItem>();
  openTimer = output<TaskItem>();
  openRecurrence = output<TaskItem>();
  tagClicked = output<string>();

  readonly isMenuOpen = signal<boolean>(false);

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isMenuOpen.set(false);
    }
  }

  readonly isCompleted = computed(() => this.task().lifecycleStatus === 'Completed');

  readonly isOverdue = computed(() => {
    const due = this.task().dueDate;
    if (!due || this.isCompleted()) return false;
    return new Date(due).getTime() < Date.now();
  });

  readonly formattedDueDate = computed(() => {
    const due = this.task().dueDate;
    if (!due) return null;
    const d = new Date(due);
    const locale = this.languageService.currentLanguage() === 'vi' ? 'vi-VN' : 'en-US';
    return d.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen.update((v) => !v);
  }

  toggleComplete(event: MouseEvent): void {
    event.stopPropagation();
    this.tasksService.toggleComplete(this.task()).subscribe();
  }

  onEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen.set(false);
    this.editTask.emit(this.task());
  }

  onStartTimer(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen.set(false);
    this.openTimer.emit(this.task());
  }

  onRecurrence(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen.set(false);
    this.openRecurrence.emit(this.task());
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen.set(false);
    this.tasksService.softDeleteTask(this.task().id).subscribe();
  }

  onTagClick(tag: string, event: MouseEvent): void {
    event.stopPropagation();
    this.tagClicked.emit(tag);
  }

  getTagColor(tagName: string): string {
    const found = this.tasksService.tags().find((t) => t.name.toLowerCase() === tagName.toLowerCase());
    return found?.color || '#10b981';
  }

  getPriorityLabel(p: TaskPriority): string {
    switch (p) {
      case 'HIGH':
        return this.languageService.t().tasks.high;
      case 'LOW':
        return this.languageService.t().tasks.low;
      default:
        return this.languageService.t().tasks.medium;
    }
  }
}
