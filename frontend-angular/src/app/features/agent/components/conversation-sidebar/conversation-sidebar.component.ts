import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConversationItem } from '../../models/agent.models';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-conversation-sidebar',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  templateUrl: './conversation-sidebar.component.html',
  styleUrl: './conversation-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationSidebarComponent {
  readonly languageService = inject(LanguageService);

  conversations = input.required<ConversationItem[]>();
  activeConversationId = input<string | null>(null);

  selectConversation = output<string>();
  newConversation = output<void>();
  deleteConversation = output<string>();

  getDisplayTitle(rawTitle: string | undefined): string {
    if (
      !rawTitle ||
      rawTitle.trim() === '' ||
      rawTitle.trim().toLowerCase() === 'new conversation' ||
      rawTitle.trim().toLowerCase() === 'cuộc trò chuyện mới'
    ) {
      return this.languageService.t().agent.defaultConvTitle;
    }
    return rawTitle;
  }

  onDelete(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.deleteConversation.emit(id);
  }
}
