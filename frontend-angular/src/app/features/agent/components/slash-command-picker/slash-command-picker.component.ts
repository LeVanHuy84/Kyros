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
import { AppIconComponent, AppIconName } from '@shared/components/icon/icon.component';
import { LanguageService } from '@core/services/language.service';

export interface SlashCommand {
  name: string;
  syntax: string;
  icon: AppIconName;
  descriptionKey: string;
  descriptionVi: string;
  descriptionEn: string;
  example: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    name: '/memory',
    syntax: '/memory <nội dung>',
    icon: 'brain',
    descriptionKey: 'cmdMemory',
    descriptionVi: 'Lưu thói quen, sở thích hoặc phong cách giao tiếp vào Memory Vault',
    descriptionEn: 'Save a habit, preference, or communication style to Memory Vault',
    example: '/memory Xưng hô là Kyros, luôn tóm tắt dạng bảng',
  },
  {
    name: '/rule',
    syntax: '/rule <nguyên tắc>',
    icon: 'check-square',
    descriptionKey: 'cmdRule',
    descriptionVi: 'Thiết lập quy tắc làm việc / giờ giấc cố định',
    descriptionEn: 'Set a permanent working or scheduling rule',
    example: '/rule Không nhận lịch họp vào sáng thứ 2',
  },
  {
    name: '/task',
    syntax: '/task <tiêu đề> [thời gian]',
    icon: 'check-circle',
    descriptionKey: 'cmdTask',
    descriptionVi: 'Tạo nhiệm vụ công việc mới (Todo)',
    descriptionEn: 'Create a new task with due date',
    example: '/task Hoàn thành slide báo cáo 17:00 ngày mai',
  },
  {
    name: '/event',
    syntax: '/event <tiêu đề> [thời gian]',
    icon: 'calendar',
    descriptionKey: 'cmdEvent',
    descriptionVi: 'Lên lịch sự kiện / cuộc họp mới (Calendar)',
    descriptionEn: 'Schedule a new calendar event or meeting',
    example: '/event Họp Sprint Review 14:00 thứ 6',
  },
  {
    name: '/note',
    syntax: '/note <tiêu đề>: <nội dung>',
    icon: 'file-text',
    descriptionKey: 'cmdNote',
    descriptionVi: 'Tạo nhanh một ghi chú mới',
    descriptionEn: 'Create a quick new note',
    example: '/note Ý tưởng Phase 6: Thêm Voice Command',
  },
  {
    name: '/recall',
    syntax: '/recall <từ khóa>',
    icon: 'search',
    descriptionKey: 'cmdRecall',
    descriptionVi: 'Tra cứu trí nhớ và quy tắc trong Memory Vault',
    descriptionEn: 'Search long-term memory & rules in Memory Vault',
    example: '/recall quy tắc họp',
  },
  {
    name: '/list',
    syntax: '/list <tasks|events|notes>',
    icon: 'layout-list',
    descriptionKey: 'cmdList',
    descriptionVi: 'Xem nhanh danh sách nhiệm vụ, lịch trình hoặc ghi chú',
    descriptionEn: 'Quick list tasks, events, or notes',
    example: '/list tasks',
  },
  {
    name: '/help',
    syntax: '/help',
    icon: 'info',
    descriptionKey: 'cmdHelp',
    descriptionVi: 'Hiển thị bảng tra cứu toàn bộ lệnh và phím tắt',
    descriptionEn: 'Show all available slash commands and shortcuts',
    example: '/help',
  },
];

@Component({
  selector: 'app-slash-command-picker',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  templateUrl: './slash-command-picker.component.html',
  styleUrl: './slash-command-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlashCommandPickerComponent {
  private readonly elementRef = inject(ElementRef);
  readonly languageService = inject(LanguageService);

  filterQuery = input<string>('');
  selectedIndex = signal<number>(0);

  commandSelected = output<SlashCommand>();
  closePicker = output<void>();

  readonly allCommands = SLASH_COMMANDS;

  readonly filteredCommands = computed(() => {
    const raw = this.filterQuery().toLowerCase().trim();
    if (!raw || raw === '/') return this.allCommands;
    const q = raw.startsWith('/') ? raw : `/${raw}`;
    return this.allCommands.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.descriptionVi.toLowerCase().includes(q.replace('/', '')) ||
        c.descriptionEn.toLowerCase().includes(q.replace('/', ''))
    );
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closePicker.emit();
    }
  }

  select(cmd: SlashCommand): void {
    this.commandSelected.emit(cmd);
    this.closePicker.emit();
  }

  selectNext(): void {
    const total = this.filteredCommands().length;
    if (total === 0) return;
    this.selectedIndex.update((i) => (i + 1) % total);
  }

  selectPrevious(): void {
    const total = this.filteredCommands().length;
    if (total === 0) return;
    this.selectedIndex.update((i) => (i - 1 + total) % total);
  }

  getSelected(): SlashCommand | null {
    const list = this.filteredCommands();
    if (list.length === 0) return null;
    const idx = Math.min(this.selectedIndex(), list.length - 1);
    return list[idx];
  }
}
