import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageItem } from '../../models/agent.models';
import { ChatBubbleComponent } from '../chat-bubble/chat-bubble.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, ChatBubbleComponent, AppIconComponent],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWindowComponent {
  readonly languageService = inject(LanguageService);

  messages = input.required<MessageItem[]>();
  isThinking = input<boolean>(false);
  userName = input<string>('User');

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  readonly userScrolledUp = signal<boolean>(false);
  private prevMessageCount = 0;

  constructor() {
    effect(() => {
      const msgs = this.messages();
      const count = msgs.length;
      const lastMsg = count > 0 ? msgs[count - 1] : null;

      // User sent a message or conversation switched/cleared: reset scroll state to bottom
      if (lastMsg?.sender === 'user' || count < this.prevMessageCount) {
        this.userScrolledUp.set(false);
      }
      this.prevMessageCount = count;

      // Only auto-scroll down if the user has not scrolled up to view message history
      if (!this.userScrolledUp()) {
        requestAnimationFrame(() => {
          this.scrollToBottom();
        });
      }
    });
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      if (this.userScrolledUp()) {
        this.userScrolledUp.set(false);
      }
      return;
    }

    const distanceFromBottom = maxScroll - el.scrollTop;
    // For small scroll containers (e.g. maxScroll = 30px), threshold scales down so scrolling up is not falsely marked as at-bottom
    const threshold = Math.min(25, Math.max(5, maxScroll * 0.2));
    const isUp = distanceFromBottom > threshold;

    if (this.userScrolledUp() !== isUp) {
      this.userScrolledUp.set(isUp);
    }
  }

  manualScrollToBottom(): void {
    this.userScrolledUp.set(false);
    this.scrollToBottom(true);
  }

  scrollToBottom(smooth = false): void {
    const el = this.scrollContainer?.nativeElement;
    if (el) {
      if (smooth) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      } else {
        el.scrollTop = el.scrollHeight;
      }
    }
  }
}
