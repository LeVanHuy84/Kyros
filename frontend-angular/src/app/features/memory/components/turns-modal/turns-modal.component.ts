import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { MarkdownViewerComponent } from '@shared/components/markdown/markdown-viewer.component';
import { ConversationSummary, ConversationTurn } from '../../models/memory.models';
import { MemoryService } from '../../services/memory.service';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-turns-modal',
  standalone: true,
  imports: [CommonModule, AppIconComponent, MarkdownViewerComponent],
  templateUrl: './turns-modal.component.html',
  styleUrl: './turns-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnsModalComponent {
  readonly conversation = input<ConversationSummary | null>(null);
  readonly turns = input<ConversationTurn[]>([]);
  readonly closed = output<void>();

  readonly memoryService = inject(MemoryService);
  readonly languageService = inject(LanguageService);

  onClose(): void {
    this.closed.emit();
  }

  onClearHistory(): void {
    const conv = this.conversation();
    if (!conv) return;

    const convId = conv.id || conv.conversationId || '';
    if (!convId) return;

    const confirmMsg = this.languageService.t().memory.audit.clearHistoryConfirm;
    if (confirm(confirmMsg)) {
      this.memoryService.clearConversationHistory(convId).subscribe();
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  isUserRole(role: string): boolean {
    return role.toLowerCase() === 'user';
  }

  isAgentRole(role: string): boolean {
    return role.toLowerCase() === 'agent' || role.toLowerCase() === 'assistant';
  }
}
