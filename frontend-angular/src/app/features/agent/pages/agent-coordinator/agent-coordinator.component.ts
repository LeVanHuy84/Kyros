import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AgentChatService } from '../../services/agent-chat.service';
import { AuthService } from '@core/auth/services/auth.service';
import { WorkspaceService } from '@core/workspace/services/workspace.service';
import { LanguageService } from '@core/services/language.service';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ConversationSidebarComponent } from '../../components/conversation-sidebar/conversation-sidebar.component';
import { ChatWindowComponent } from '../../components/chat-window/chat-window.component';
import { ChatInputAreaComponent } from '../../components/chat-input-area/chat-input-area.component';
import { ApprovalBannerComponent } from '../../components/approval-banner/approval-banner.component';
import { ByokWarningBannerComponent } from '../../components/byok-warning-banner/byok-warning-banner.component';
import { ExecutiveBriefingModalComponent } from '../../components/executive-briefing/executive-briefing-modal.component';
import { Note } from '@features/notes/models/note.models';

@Component({
  selector: 'app-agent-coordinator',
  standalone: true,
  imports: [
    CommonModule,
    AppIconComponent,
    ConversationSidebarComponent,
    ChatWindowComponent,
    ChatInputAreaComponent,
    ApprovalBannerComponent,
    ByokWarningBannerComponent,
    ExecutiveBriefingModalComponent,
  ],
  templateUrl: './agent-coordinator.component.html',
  styleUrl: './agent-coordinator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentCoordinatorComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  readonly agentChatService = inject(AgentChatService);
  readonly authService = inject(AuthService);
  readonly workspaceService = inject(WorkspaceService);
  readonly languageService = inject(LanguageService);

  readonly showBriefingModal = signal<boolean>(false);
  readonly isSettingsMenuOpen = signal<boolean>(false);
  readonly isConvSidebarOpen = signal<boolean>(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isSettingsMenuOpen.set(false);
      this.isConvSidebarOpen.set(false);
    }
  }

  ngOnInit(): void {
    // Check BYOK Key and load conversations
    this.agentChatService.checkAiConfig().subscribe();
    this.agentChatService.loadConversations().subscribe();
  }

  toggleConvSidebar(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isConvSidebarOpen.update((v) => !v);
  }

  toggleSettingsMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isSettingsMenuOpen.update((v) => !v);
  }

  openBriefingFromMenu(): void {
    this.isSettingsMenuOpen.set(false);
    this.showBriefingModal.set(true);
  }

  openByokFromMenu(): void {
    this.navigateToFullSettings();
  }

  navigateToFullSettings(): void {
    this.isSettingsMenuOpen.set(false);
    this.router.navigate(['/settings'], { queryParams: { tab: 'ai' } });
  }

  toggleStreamingMode(): void {
    this.agentChatService.isStreamingMode.update((v) => !v);
  }

  onSelectConversation(convId: string): void {
    this.isConvSidebarOpen.set(false);
    this.agentChatService.loadConversationTurns(convId).subscribe();
  }

  onNewConversation(): void {
    this.isConvSidebarOpen.set(false);
    this.agentChatService.startNewConversation().subscribe();
  }

  onDeleteConversation(convId: string): void {
    this.agentChatService.deleteConversation(convId).subscribe();
  }

  onSendMessage(prompt: string): void {
    this.agentChatService.sendMessage(prompt);
  }

  onAddNote(note: Note): void {
    this.agentChatService.addSelectedNote(note);
  }

  onRemoveNote(noteId: string): void {
    this.agentChatService.removeSelectedNote(noteId);
  }

  onApproveAction(): void {
    this.agentChatService.approveAction();
  }

  onRejectAction(): void {
    this.agentChatService.rejectAction();
  }

  onConfigSaved(): void {
    this.agentChatService.checkAiConfig().subscribe();
  }
}
