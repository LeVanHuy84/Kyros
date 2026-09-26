import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TasksService } from '../../services/tasks.service';
import { AppIconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-tag-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  templateUrl: './tag-picker.component.html',
  styleUrl: './tag-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagPickerComponent {
  readonly tasksService = inject(TasksService);
  private readonly elementRef = inject(ElementRef);

  selectedTags = input<string[]>([]);
  tagsChange = output<string[]>();

  readonly isOpen = signal<boolean>(false);
  readonly newTagName = signal<string>('');

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown(): void {
    this.isOpen.update((v) => !v);
  }

  toggleTag(tagName: string): void {
    const current = [...this.selectedTags()];
    const index = current.indexOf(tagName);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(tagName);
    }
    this.tagsChange.emit(current);
  }

  removeTag(tagName: string, event: MouseEvent): void {
    event.stopPropagation();
    const current = this.selectedTags().filter((t) => t !== tagName);
    this.tagsChange.emit(current);
  }

  createNewTag(): void {
    const name = this.newTagName().trim();
    if (!name) return;

    // Check if tag already exists
    const existing = this.tasksService.tags().find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!this.selectedTags().includes(existing.name)) {
        this.tagsChange.emit([...this.selectedTags(), existing.name]);
      }
      this.newTagName.set('');
      return;
    }

    const defaultColors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6'];
    const randomColor = defaultColors[Math.floor(Math.random() * defaultColors.length)];

    this.tasksService.createTag({ name, color: randomColor }).subscribe({
      next: (created) => {
        this.tagsChange.emit([...this.selectedTags(), created.name]);
        this.newTagName.set('');
      },
    });
  }

  getTagColor(tagName: string): string {
    const found = this.tasksService.tags().find((t) => t.name.toLowerCase() === tagName.toLowerCase());
    return found?.color || '#10b981';
  }
}
