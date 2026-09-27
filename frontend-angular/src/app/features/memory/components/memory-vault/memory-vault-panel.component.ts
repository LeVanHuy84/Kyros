import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal.component';
import { MemoryService } from '../../services/memory.service';
import { MemoryEntry } from '../../models/memory.models';
import { LanguageService } from '@core/services/language.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

export type MemoryCategoryFilter = 'all' | 'USER_PREFERENCE' | 'WORK_RULE' | 'PROJECT_CONTEXT' | 'CONSTRAINT' | 'GENERAL';

@Component({
  selector: 'app-memory-vault-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, ConfirmModalComponent],
  templateUrl: './memory-vault-panel.component.html',
  styleUrl: './memory-vault-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemoryVaultPanelComponent implements OnInit {
  readonly memoryService = inject(MemoryService);
  readonly languageService = inject(LanguageService);

  readonly selectedCategory = signal<MemoryCategoryFilter>('all');
  readonly isModalOpen = signal<boolean>(false);
  readonly editingEntry = signal<MemoryEntry | null>(null);
  readonly formContent = signal<string>('');
  readonly formCategory = signal<string>('USER_PREFERENCE');
  readonly formConfidence = signal<number>(1.0);

  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly entryToDelete = signal<MemoryEntry | null>(null);
  readonly isDeleting = signal<boolean>(false);

  private readonly search$ = new Subject<string>();

  readonly filteredEntries = computed(() => {
    const entries = this.memoryService.memoryEntries();
    const category = this.selectedCategory();
    if (category === 'all') {
      return entries;
    }
    return entries.filter((e) => this.extractCategory(e.content) === category);
  });

  ngOnInit(): void {
    this.memoryService.fetchMemoryEntries().subscribe();

    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((query) => {
        this.memoryService.fetchMemoryEntries(query).subscribe();
      });
  }

  onSearch(val: string): void {
    this.memoryService.searchQuery.set(val);
    this.search$.next(val);
  }

  setCategory(cat: MemoryCategoryFilter): void {
    this.selectedCategory.set(cat);
  }

  openAddModal(): void {
    this.editingEntry.set(null);
    this.formContent.set('');
    this.formCategory.set('USER_PREFERENCE');
    this.formConfidence.set(1.0);
    this.isModalOpen.set(true);
  }

  openEditModal(entry: MemoryEntry): void {
    this.editingEntry.set(entry);
    const cat = this.extractCategory(entry.content);
    const cleanContent = this.cleanFactContent(entry.content);
    this.formCategory.set(cat === 'GENERAL' ? 'USER_PREFERENCE' : cat);
    this.formContent.set(cleanContent);
    this.formConfidence.set(entry.confidenceScore || 1.0);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingEntry.set(null);
  }

  saveEntry(): void {
    const rawContent = this.formContent().trim();
    if (!rawContent) return;

    const cat = this.formCategory();
    const contentVal = `[${cat}] ${rawContent}`;
    const confidenceVal = Number(this.formConfidence()) || 1.0;
    const editing = this.editingEntry();

    if (editing) {
      this.memoryService
        .updateMemoryEntry(editing.id, {
          content: contentVal,
          confidenceScore: confidenceVal,
        })
        .subscribe(() => {
          this.closeModal();
        });
    } else {
      this.memoryService
        .createMemoryEntry({
          content: contentVal,
          confidenceScore: confidenceVal,
        })
        .subscribe(() => {
          this.closeModal();
        });
    }
  }

  openDeleteModal(event: MouseEvent, entry: MemoryEntry): void {
    event.stopPropagation();
    this.entryToDelete.set(entry);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.entryToDelete.set(null);
  }

  onConfirmDelete(): void {
    const entry = this.entryToDelete();
    if (!entry) return;

    this.isDeleting.set(true);
    this.memoryService.deleteMemoryEntry(entry.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
      },
      error: () => {
        this.isDeleting.set(false);
      },
    });
  }

  extractCategory(content: string): string {
    if (!content) return 'GENERAL';
    const match = content.match(/^\[([A-Z_]+)\]/);
    return match ? match[1] : 'GENERAL';
  }

  cleanFactContent(content: string): string {
    if (!content) return '';
    return content.replace(/^\[[A-Z_]+\]\s*/, '');
  }

  isAutoSynthesized(entry: MemoryEntry): boolean {
    if (!entry.content) return false;
    return /^\[[A-Z_]+\]/.test(entry.content) || (entry.confidenceScore !== undefined && entry.confidenceScore < 1.0);
  }

  getCategoryBadgeLabel(cat: string): string {
    const t = this.languageService.t().memory.vault.categories;
    switch (cat) {
      case 'USER_PREFERENCE':
        return t.preferences;
      case 'WORK_RULE':
        return t.rules;
      case 'PROJECT_CONTEXT':
        return t.projects;
      case 'CONSTRAINT':
        return t.constraints;
      default:
        return t.general;
    }
  }

  formatConfidence(score?: number): string {
    const val = (score !== undefined && score !== null) ? score : 1.0;
    return `${Math.round(val * 100)}%`;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
