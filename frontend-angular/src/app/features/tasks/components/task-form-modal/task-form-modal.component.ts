import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateTaskDto, TaskItem, TaskPriority, UpdateTaskDto } from '../../models/task.models';
import { TasksService } from '../../services/tasks.service';
import { TagPickerComponent } from '../tag-picker/tag-picker.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ToastService } from '@shared/components/toast/toast.service';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-task-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TagPickerComponent,
    AppIconComponent,
    ButtonComponent,
  ],
  templateUrl: './task-form-modal.component.html',
  styleUrl: './task-form-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormModalComponent {
  readonly tasksService = inject(TasksService);
  readonly languageService = inject(LanguageService);
  private readonly toastService = inject(ToastService);

  isOpen = input<boolean>(false);
  taskToEdit = input<TaskItem | null>(null);
  defaultPriority = input<TaskPriority>('MEDIUM');

  closeModal = output<void>();
  taskSaved = output<TaskItem>();

  readonly title = signal<string>('');
  readonly description = signal<string>('');
  readonly priority = signal<TaskPriority>('MEDIUM');
  readonly dueDate = signal<string>('');
  readonly estimatedDuration = signal<number | null>(null);
  readonly tags = signal<string[]>([]);
  readonly autoSchedule = signal<boolean>(false);

  readonly isSaving = signal<boolean>(false);

  constructor() {
    effect(() => {
      const isModalOpen = this.isOpen();
      const task = this.taskToEdit();
      if (!isModalOpen) return;

      if (task) {
        this.title.set(task.title);
        this.description.set(task.description || '');
        this.priority.set(task.priority);
        this.dueDate.set(task.dueDate ? this.formatDateForInput(task.dueDate) : '');
        this.estimatedDuration.set(task.estimatedDurationMinutes || null);
        this.tags.set([...task.tags]);
        this.autoSchedule.set(task.autoSchedule || false);
      } else {
        this.resetForm();
        this.priority.set(this.defaultPriority());
      }
    }, { allowSignalWrites: true });
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.isOpen() && event.ctrlKey && event.key === 'Enter') {
      this.handleSave();
    }
  }

  setPriority(p: TaskPriority): void {
    this.priority.set(p);
  }

  handleSave(): void {
    const rawTitle = this.title().trim();
    if (!rawTitle) return;

    this.isSaving.set(true);
    const isoDueDate = this.dueDate() ? new Date(this.dueDate()).toISOString() : undefined;

    const editTask = this.taskToEdit();
    if (editTask) {
      const updateDto: UpdateTaskDto = {
        title: rawTitle,
        description: this.description().trim() || undefined,
        priority: this.priority(),
        dueDate: isoDueDate,
        estimatedDurationMinutes: this.estimatedDuration() || undefined,
        autoSchedule: this.autoSchedule(),
        version: editTask.version,
      };

      this.tasksService.updateTask(editTask.id, updateDto).subscribe({
        next: (updated) => {
          this.isSaving.set(false);
          this.toastService.success('Đã cập nhật nhiệm vụ!');
          this.taskSaved.emit(updated);
          this.closeModal.emit();
        },
        error: () => {
          this.isSaving.set(false);
          this.toastService.error('Không thể cập nhật nhiệm vụ.');
        },
      });
    } else {
      const createDto: CreateTaskDto = {
        title: rawTitle,
        description: this.description().trim() || undefined,
        priority: this.priority(),
        tags: this.tags(),
        dueDate: isoDueDate,
        estimatedDurationMinutes: this.estimatedDuration() || undefined,
        autoSchedule: this.autoSchedule(),
      };

      this.tasksService.createTask(createDto).subscribe({
        next: (created) => {
          this.isSaving.set(false);
          this.toastService.success('Đã tạo nhiệm vụ mới!');
          this.taskSaved.emit(created);
          this.closeModal.emit();
        },
        error: () => {
          this.isSaving.set(false);
          this.toastService.error('Không thể tạo nhiệm vụ.');
        },
      });
    }
  }

  private resetForm(): void {
    this.title.set('');
    this.description.set('');
    this.priority.set('MEDIUM');
    this.dueDate.set('');
    this.estimatedDuration.set(null);
    this.tags.set([]);
    this.autoSchedule.set(false);
  }

  private formatDateForInput(isoString: string): string {
    const d = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
