import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { MemoryService } from '../../services/memory.service';
import { MemoryEntry } from '../../models/memory.models';
import { LanguageService } from '@core/services/language.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-memory-vault-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  templateUrl: './memory-vault-panel.component.html',
  styleUrl: './memory-vault-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemoryVaultPanelComponent implements OnInit {
  readonly memoryService = inject(MemoryService);
  readonly languageService = inject(LanguageService);

  readonly isModalOpen = signal<boolean>(false);
  readonly editingEntry = signal<MemoryEntry | null>(null);
  readonly formContent = signal<string>('');
  readonly formConfidence = signal<number>(1.0);

  private readonly search$ = new Subject<string>();

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

  openAddModal(): void {
    this.editingEntry.set(null);
    this.formContent.set('');
    this.formConfidence.set(1.0);
    this.isModalOpen.set(true);
  }

  openEditModal(entry: MemoryEntry): void {
    this.editingEntry.set(entry);
    this.formContent.set(entry.content);
    this.formConfidence.set(entry.confidenceScore || 1.0);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingEntry.set(null);
  }

  saveEntry(): void {
    const contentVal = this.formContent().trim();
    if (!contentVal) return;

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

  deleteEntry(event: MouseEvent, entry: MemoryEntry): void {
    event.stopPropagation();
    const confirmMsg = this.languageService.t().memory.vault.deleteConfirm;
    if (confirm(confirmMsg)) {
      this.memoryService.deleteMemoryEntry(entry.id).subscribe();
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
