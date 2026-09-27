import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal.component';
import { MarkdownViewerComponent } from '@shared/components/markdown/markdown-viewer.component';
import { ConversationSummary, ConversationTurn } from '../../models/memory.models';
import { MemoryService } from '../../services/memory.service';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-turns-modal',
  standalone: true,
  imports: [CommonModule, AppIconComponent, MarkdownViewerComponent, ConfirmModalComponent],
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

  readonly isClearConfirmOpen = signal<boolean>(false);
  readonly isClearing = signal<boolean>(false);

  onClose(): void {
    this.closed.emit();
  }

  onClearHistory(): void {
    const conv = this.conversation();
    if (!conv) return;

    const convId = conv.id || conv.conversationId || '';
    if (!convId) return;

    this.isClearConfirmOpen.set(true);
  }

  closeClearConfirm(): void {
    this.isClearConfirmOpen.set(false);
  }

  onConfirmClearHistory(): void {
    const conv = this.conversation();
    if (!conv) return;

    const convId = conv.id || conv.conversationId || '';
    if (!convId) return;

    this.isClearing.set(true);
    this.memoryService.clearConversationHistory(convId).subscribe({
      next: () => {
        this.isClearing.set(false);
        this.closeClearConfirm();
      },
      error: () => {
        this.isClearing.set(false);
      },
    });
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
