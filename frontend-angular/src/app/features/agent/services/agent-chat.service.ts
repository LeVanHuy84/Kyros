import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { ConversationItem, MessageItem, PendingApprovalData } from '../models/agent.models';
import { Note } from '@features/notes/models/note.models';
import { WorkspaceService } from '@core/workspace/services/workspace.service';
import { AiSettingsService } from '@features/settings/services/ai-settings.service';
import { LanguageService } from '@core/services/language.service';

@Injectable({
  providedIn: 'root',
})
export class AgentChatService {
  private readonly http = inject(HttpClient);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly aiSettingsService = inject(AiSettingsService);
  private readonly languageService = inject(LanguageService);

  readonly conversations = signal<ConversationItem[]>([]);
  readonly activeConversationId = signal<string | null>(null);
  readonly messages = signal<MessageItem[]>([
    {
      sender: 'agent',
      text: this.languageService.t().agent.greeting,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  readonly selectedNotes = signal<Note[]>([]);
  readonly isThinking = signal<boolean>(false);
  readonly isStreamingMode = signal<boolean>(true);
  readonly pendingApproval = signal<PendingApprovalData | null>(null);

  // BYOK key status
  readonly hasSavedKey = signal<boolean>(true);
  readonly isConfigChecking = signal<boolean>(false);

  /**
   * Checks if the active workspace has a configured AI Key.
   */
  checkAiConfig(): Observable<boolean> {
    const wsId = this.workspaceService.activeWorkspaceId();
    if (!wsId) return of(false);

    this.isConfigChecking.set(true);
    return this.aiSettingsService.fetchConfig().pipe(
      map((cfg) => {
        const hasKey = !!cfg?.hasSavedKey;
        this.hasSavedKey.set(hasKey);
        this.isConfigChecking.set(false);
        return hasKey;
      }),
      catchError(() => {
        this.hasSavedKey.set(false);
        this.isConfigChecking.set(false);
        return of(false);
      })
    );
  }

  /**
   * Fetches conversations list for active workspace.
   */
  loadConversations(): Observable<ConversationItem[]> {
    const wsId = this.workspaceService.activeWorkspaceId();
    if (!wsId) {
      this.conversations.set([]);
      return of([]);
    }

    return this.http
      .get<{ data?: ConversationItem[] } | ConversationItem[]>(
        `/api/v1/workspaces/${wsId}/conversations`
      )
      .pipe(
        map((res) => {
          const list: ConversationItem[] = Array.isArray(res) ? res : res?.data || [];
          this.conversations.set(list);

          if (list.length > 0) {
            const firstId = list[0].id;
            this.activeConversationId.set(firstId);
            this.loadConversationTurns(firstId).subscribe();
          } else {
            this.startNewConversation().subscribe();
          }
          return list;
        }),
        catchError(() => {
          this.conversations.set([]);
          return of([]);
        })
      );
  }

  /**
   * Loads past turns/messages of a specific conversation.
   */
  loadConversationTurns(convId: string): Observable<MessageItem[]> {
    const wsId = this.workspaceService.activeWorkspaceId();
    if (!wsId) return of([]);

    this.activeConversationId.set(convId);

    return this.http
      .get<any[]>(`/api/v1/workspaces/${wsId}/conversations/${convId}/turns?limit=50`)
      .pipe(
        map((turns) => {
          if (turns && turns.length > 0) {
            const mapped: MessageItem[] = turns.map((t) => {
              const roleStr = t.role || t.sender || 'agent';
              const contentStr = t.content || t.text || '';
              const timeStr = t.timestamp
                ? new Date(typeof t.timestamp === 'number' ? t.timestamp : t.timestamp).toLocaleTimeString(
                    [],
                    { hour: '2-digit', minute: '2-digit' }
                  )
                : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return {
                sender: roleStr.toLowerCase() === 'user' ? 'user' : 'agent',
                text: contentStr,
                time: timeStr,
              };
            });
            this.messages.set(mapped);
            return mapped;
          } else {
            this.resetGreeting();
            return this.messages();
          }
        }),
        catchError(() => {
          this.resetGreeting();
          return of([]);
        })
      );
  }

  /**
   * Creates a new conversation session.
   */
  startNewConversation(): Observable<string | null> {
    const wsId = this.workspaceService.activeWorkspaceId();
    if (!wsId) return of(null);

    const defaultTitle = this.languageService.t().agent.defaultConvTitle;

    return this.http
      .post<{ id: string; title?: string; status?: string }>(
        `/api/v1/workspaces/${wsId}/conversations`,
        { sessionId: null, title: defaultTitle }
      )
      .pipe(
        map((res) => {
          const newConv: ConversationItem = {
            id: res.id,
            title: res.title || defaultTitle,
            status: res.status,
          };
          this.conversations.update((prev) => [newConv, ...prev]);
          this.activeConversationId.set(newConv.id);
          this.resetGreeting();
          return newConv.id;
        }),
        catchError((err) => {
          console.warn('Failed to start new conversation', err);
          return of(null);
        })
      );
  }

  /**
   * Deletes a conversation by ID.
   */
  deleteConversation(convId: string): Observable<void> {
    const wsId = this.workspaceService.activeWorkspaceId();
    if (!wsId) return of(undefined);

    return this.http
      .delete<void>(`/api/v1/workspaces/${wsId}/conversations/${convId}`)
      .pipe(
        tap(() => {
          const updated = this.conversations().filter((c) => c.id !== convId);
          this.conversations.set(updated);
          if (this.activeConversationId() === convId) {
            if (updated.length > 0) {
              this.activeConversationId.set(updated[0].id);
              this.loadConversationTurns(updated[0].id).subscribe();
            } else {
              this.startNewConversation().subscribe();
            }
          }
        })
      );
  }

  /**
   * Sends user chat message via SSE Stream or REST fallback.
   */
  async sendMessage(promptText: string): Promise<void> {
    const userText = promptText.trim();
    if (!userText) return;

    const wsId = this.workspaceService.activeWorkspaceId();
    if (!wsId) {
      this.messages.update((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: '⚠️ Vui lòng chọn một Workspace hoạt động trước khi sử dụng Agent Coordinator.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    let currentConvId = this.activeConversationId();
    if (!currentConvId) {
      const createdId = await this.startNewConversation().toPromise();
      currentConvId = createdId || null;
    }

    const attachedNotes = this.selectedNotes().map((n) => ({ id: n.id, title: n.title }));
    const noteIds = attachedNotes.map((n) => n.id);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: MessageItem = {
      sender: 'user',
      text: userText,
      time: now,
      attachedNotes: attachedNotes.length > 0 ? attachedNotes : undefined,
    };

    this.messages.update((prev) => [...prev, userMsg]);
    this.selectedNotes.set([]);
    this.isThinking.set(true);

    // Persist user turn
    if (currentConvId) {
      this.http
        .post(`/api/v1/workspaces/${wsId}/conversations/${currentConvId}/turns`, {
          senderRole: 'USER',
          messageContent: userText,
        })
        .subscribe();
    }

    const token = localStorage.getItem('kyros_access_token');
    const headers: Record<string, string> = {
      'X-Workspace-Id': wsId,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (this.isStreamingMode()) {
      // Add empty streaming agent message
      this.messages.update((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isStreaming: true,
        },
      ]);

      try {
        const convParam = currentConvId ? `&conversationId=${encodeURIComponent(currentConvId)}` : '';
        const notesParam =
          noteIds.length > 0
            ? `&noteIds=${noteIds.map((id) => encodeURIComponent(id)).join('&noteIds=')}`
            : '';

        const response = await fetch(
          `/api/v1/workspaces/${wsId}/agent/chat/stream?prompt=${encodeURIComponent(userText)}${convParam}${notesParam}`,
          { headers }
        );

        if (!response.ok || !response.body) {
          throw new Error(`Stream HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullAgentResponse = '';
        let currentEvent = 'message';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              const rawData = line.slice(5);
              const dataText = rawData.startsWith(' ') ? rawData.slice(1) : rawData;

              if (currentEvent === 'thought') {
                this.updateLastMessageThought(dataText.trim());
              } else if (currentEvent === 'observation') {
                this.updateLastMessageThought(`🔧 ${dataText.trim()}`);
              } else if (currentEvent === 'approval') {
                try {
                  const data = JSON.parse(dataText.trim());
                  this.pendingApproval.set({
                    toolName: data.toolName,
                    argumentsJson: data.argumentsJson,
                    reason: data.reason,
                  });
                  fullAgentResponse += `⚠️ **[CẦN PHÊ DUYỆT]**: ${data.reason}\n*Công cụ:* \`${data.toolName}\`\n\n`;
                } catch {
                  // ignore
                }
              } else if (currentEvent === 'completed') {
                this.finishLastMessageStreaming();
              } else if (currentEvent === 'chunk' || currentEvent === 'message') {
                fullAgentResponse += dataText;
                this.updateLastMessageText(fullAgentResponse);
              }
            }
          }
        }

        this.finishLastMessageStreaming();

        // Persist assistant turn
        if (currentConvId && fullAgentResponse.trim()) {
          this.http
            .post(`/api/v1/workspaces/${wsId}/conversations/${currentConvId}/turns`, {
              senderRole: 'ASSISTANT',
              messageContent: fullAgentResponse.trim(),
            })
            .subscribe();
        }

        this.isThinking.set(false);
      } catch (err: any) {
        this.isThinking.set(false);
        const errorText = `⚠️ **[Lỗi kết nối Agent]**: ${err?.message || 'Không thể gọi tới Backend/LLM Service'}\n\n*[Agent Fallback]*: Đã tiếp nhận "${userText}". Engine đang xử lý ngoại tuyến.`;
        this.finishLastMessageWithError(errorText);
      }
    } else {
      // REST mode fallback
      this.http
        .post<{ finalAnswer?: string; pendingApproval?: boolean; pendingToolName?: string; pendingToolArguments?: string; approvalReason?: string }>(
          `/api/v1/workspaces/${wsId}/agent/chat`,
          { prompt: userText, noteIds }
        )
        .subscribe({
          next: (data) => {
            this.isThinking.set(false);
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let finalAnswerText = data.finalAnswer || '';

            if (data.pendingApproval) {
              this.pendingApproval.set({
                toolName: data.pendingToolName || '',
                argumentsJson: data.pendingToolArguments || '',
                reason: data.approvalReason || '',
              });
              finalAnswerText = `⚠️ **[CẦN PHÊ DUYỆT]**: ${data.approvalReason}\n*Công cụ:* \`${data.pendingToolName}\``;
            }

            this.messages.update((prev) => [...prev, { sender: 'agent', text: finalAnswerText, time }]);
          },
          error: () => {
            this.isThinking.set(false);
            this.messages.update((prev) => [
              ...prev,
              {
                sender: 'agent',
                text: `[Agent Fallback]: Đã tiếp nhận "${userText}". Engine đang xử lý ngoại tuyến.`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          },
        });
    }
  }

  /**
   * Approves a pending tool call action.
   */
  approveAction(): void {
    const approval = this.pendingApproval();
    const wsId = this.workspaceService.activeWorkspaceId();
    if (!approval || !wsId) return;

    this.isThinking.set(true);
    this.http
      .post<{ finalAnswer?: string }>(`/api/v1/workspaces/${wsId}/agent/approve`, {
        toolName: approval.toolName,
        argumentsJson: approval.argumentsJson,
      })
      .subscribe({
        next: (res) => {
          this.isThinking.set(false);
          this.pendingApproval.set(null);
          this.messages.update((prev) => [
            ...prev,
            {
              sender: 'agent',
              text: res.finalAnswer || '✅ Hành động đã được thực thi thành công.',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        },
        error: () => {
          this.isThinking.set(false);
        },
      });
  }

  rejectAction(): void {
    this.pendingApproval.set(null);
    this.messages.update((prev) => [
      ...prev,
      {
        sender: 'agent',
        text: '❌ Bạn đã từ chối thực thi hành động này.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }

  // Helper note selection methods
  addSelectedNote(note: Note): void {
    if (!this.selectedNotes().some((n) => n.id === note.id)) {
      this.selectedNotes.update((prev) => [...prev, note]);
    }
  }

  removeSelectedNote(noteId: string): void {
    this.selectedNotes.update((prev) => prev.filter((n) => n.id !== noteId));
  }

  private updateLastMessageThought(status: string): void {
    this.messages.update((prev) => {
      const next = [...prev];
      if (next.length > 0 && next[next.length - 1].sender === 'agent') {
        const last = next[next.length - 1];
        const steps = last.thoughtSteps || [];
        const updatedSteps = last.activeThoughtStatus ? [...steps, last.activeThoughtStatus] : steps;
        next[next.length - 1] = {
          ...last,
          activeThoughtStatus: status,
          thoughtSteps: updatedSteps,
        };
      }
      return next;
    });
  }

  private updateLastMessageText(text: string): void {
    this.messages.update((prev) => {
      const next = [...prev];
      if (next.length > 0 && next[next.length - 1].sender === 'agent') {
        next[next.length - 1] = {
          ...next[next.length - 1],
          text,
          isStreaming: true,
        };
      }
      return next;
    });
  }

  private finishLastMessageStreaming(): void {
    this.messages.update((prev) => {
      const next = [...prev];
      if (next.length > 0 && next[next.length - 1].sender === 'agent') {
        next[next.length - 1] = {
          ...next[next.length - 1],
          activeThoughtStatus: undefined,
          isStreaming: false,
        };
      }
      return next;
    });
  }

  private finishLastMessageWithError(errorText: string): void {
    this.messages.update((prev) => {
      const next = [...prev];
      if (next.length > 0 && next[next.length - 1].sender === 'agent') {
        next[next.length - 1] = {
          sender: 'agent',
          text: errorText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isStreaming: false,
        };
      } else {
        next.push({
          sender: 'agent',
          text: errorText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
      return next;
    });
  }

  private resetGreeting(): void {
    this.messages.set([
      {
        sender: 'agent',
        text: this.languageService.t().agent.greeting,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }
}
