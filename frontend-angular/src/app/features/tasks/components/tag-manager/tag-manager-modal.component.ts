import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TasksService } from '../../services/tasks.service';
import { WorkspaceTag } from '../../models/task.models';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ToastService } from '@shared/components/toast/toast.service';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-tag-manager-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, ButtonComponent],
  templateUrl: './tag-manager-modal.component.html',
  styleUrl: './tag-manager-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagManagerModalComponent {
  readonly tasksService = inject(TasksService);
  readonly languageService = inject(LanguageService);
  private readonly toastService = inject(ToastService);

  isOpen = input<boolean>(false);
  closeModal = output<void>();

  readonly editingTagId = signal<string | null>(null);
  readonly tagName = signal<string>('');
  readonly selectedColor = signal<string>('#10b981');

  readonly colorPalette = [
    '#10b981', // Emerald
    '#059669', // Forest
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#64748b', // Slate
  ];

  startEdit(tag: WorkspaceTag): void {
    this.editingTagId.set(tag.tagId);
    this.tagName.set(tag.name);
    this.selectedColor.set(tag.color);
  }

  cancelEdit(): void {
    this.editingTagId.set(null);
    this.tagName.set('');
    this.selectedColor.set('#10b981');
  }

  saveTag(): void {
    const name = this.tagName().trim();
    if (!name) return;

    const editId = this.editingTagId();
    if (editId) {
      this.tasksService
        .updateTag(editId, { name, color: this.selectedColor() })
        .subscribe({
          next: () => {
            this.toastService.success('Đã cập nhật nhãn thành công!');
            this.cancelEdit();
          },
          error: () => this.toastService.error('Không thể cập nhật nhãn.'),
        });
    } else {
      this.tasksService
        .createTag({ name, color: this.selectedColor() })
        .subscribe({
          next: () => {
            this.toastService.success('Đã tạo nhãn mới thành công!');
            this.cancelEdit();
          },
          error: () => this.toastService.error('Không thể tạo nhãn.'),
        });
    }
  }

  deleteTag(tagId: string): void {
    if (confirm('Bạn có chắc chắn muốn xóa nhãn này không?')) {
      this.tasksService.deleteTag(tagId).subscribe({
        next: () => this.toastService.success('Đã xóa nhãn.'),
        error: () => this.toastService.error('Không thể xóa nhãn.'),
      });
    }
  }
}
