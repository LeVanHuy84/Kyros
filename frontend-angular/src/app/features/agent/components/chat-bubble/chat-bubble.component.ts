import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageItem } from '../../models/agent.models';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { KyrosLogoComponent } from '@shared/components/logo/kyros-logo.component';
import { MarkdownViewerComponent } from '@shared/components/markdown/markdown-viewer.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  imports: [
    CommonModule,
    AvatarComponent,
    KyrosLogoComponent,
    MarkdownViewerComponent,
    AppIconComponent,
  ],
  templateUrl: './chat-bubble.component.html',
  styleUrl: './chat-bubble.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatBubbleComponent {
  readonly languageService = inject(LanguageService);

  message = input.required<MessageItem>();
  userName = input<string>('User');

  readonly isThoughtsExpanded = signal<boolean>(false);

  toggleThoughts(): void {
    this.isThoughtsExpanded.update((v) => !v);
  }
}
