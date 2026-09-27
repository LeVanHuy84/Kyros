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
import { MemoryService } from '../../services/memory.service';
import { ConversationSummary } from '../../models/memory.models';
import { TurnsModalComponent } from '../turns-modal/turns-modal.component';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-conversations-directory-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, TurnsModalComponent],
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

  deleteConversation(event: MouseEvent, conv: ConversationSummary): void {
    event.stopPropagation();
    const convId = conv.id || conv.conversationId || '';
    if (!convId) return;

    const confirmMsg = this.languageService.t().memory.audit.deleteConvConfirm;
    if (confirm(confirmMsg)) {
      this.memoryService.deleteConversation(convId).subscribe();
    }
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
