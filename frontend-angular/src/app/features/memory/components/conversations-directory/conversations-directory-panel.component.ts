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
import { ConversationSummary } from '../../models/memory.models';
import { TurnsModalComponent } from '../turns-modal/turns-modal.component';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-conversations-directory-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, TurnsModalComponent, ConfirmModalComponent],
  templateUrl: './conversations-directory-panel.component.html',
  styleUrl: './conversations-directory-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationsDirectoryPanelComponent implements OnInit {
  readonly memoryService = inject(MemoryService);
  readonly languageService = inject(LanguageService);

  readonly searchQuery = signal<string>('');
  readonly selectedConversation = signal<ConversationSummary | null>(null);
  readonly isTurnsModalOpen = signal<boolean>(false);

  readonly isDeleteModalOpen = signal<boolean>(false);
  readonly convToDelete = signal<ConversationSummary | null>(null);
  readonly isDeleting = signal<boolean>(false);

  readonly filteredConversations = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.memoryService.conversations();
    if (!q) return list;
    return list.filter((c) => c.title.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.memoryService.fetchConversations().subscribe();
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
  }

  openTurnsModal(conv: ConversationSummary): void {
    const convId = conv.id || conv.conversationId || '';
    this.selectedConversation.set(conv);
    this.isTurnsModalOpen.set(true);
    if (convId) {
      this.memoryService.fetchConversationTurns(convId).subscribe();
    }
  }

  closeTurnsModal(): void {
    this.isTurnsModalOpen.set(false);
    this.selectedConversation.set(null);
  }

  openDeleteModal(event: MouseEvent, conv: ConversationSummary): void {
    event.stopPropagation();
    this.convToDelete.set(conv);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.convToDelete.set(null);
  }

  onConfirmDelete(): void {
    const conv = this.convToDelete();
    if (!conv) return;

    const convId = conv.id || conv.conversationId || '';
    if (!convId) return;

    this.isDeleting.set(true);
    this.memoryService.deleteConversation(convId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
      },
      error: () => {
        this.isDeleting.set(false);
      },
    });
  }

  formatDate(dateStr?: string | null): string {
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
