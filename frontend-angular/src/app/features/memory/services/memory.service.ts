import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import {
  ConversationSummary,
  ConversationTurn,
  ConversationsApiResponse,
  CreateMemoryEntryRequest,
  MemoryEntriesApiResponse,
  MemoryEntry,
  UpdateMemoryEntryRequest,
} from '../models/memory.models';
import { WorkspaceContextService } from '@core/services/workspace-context.service';

@Injectable({
  providedIn: 'root',
})
export class MemoryService {
  private readonly http = inject(HttpClient);
  private readonly workspaceContext = inject(WorkspaceContextService);

  readonly memoryEntries = signal<MemoryEntry[]>([]);
  readonly conversations = signal<ConversationSummary[]>([]);
  readonly activeConversationTurns = signal<ConversationTurn[]>([]);
  readonly activeConversationId = signal<string | null>(null);

  readonly isLoadingMemories = signal<boolean>(false);
  readonly isLoadingConversations = signal<boolean>(false);
  readonly isLoadingTurns = signal<boolean>(false);
  readonly isSavingMemory = signal<boolean>(false);

  readonly searchQuery = signal<string>('');

  private get wsId(): string {
    return this.workspaceContext.activeWorkspaceId() || '';
  }

  fetchMemoryEntries(query?: string): Observable<MemoryEntriesApiResponse | null> {
    const wsId = this.wsId;
    if (!wsId) {
      this.memoryEntries.set([]);
      return of(null);
    }

    this.isLoadingMemories.set(true);
    let params = new HttpParams().set('page', '0').set('size', '50');
    if (query && query.trim()) {
      params = params.set('query', query.trim());
    }

    return this.http
      .get<MemoryEntriesApiResponse>(`/api/v1/workspaces/${wsId}/memory-entries`, { params })
      .pipe(
        tap((res) => {
          this.memoryEntries.set(res?.data || []);
          this.isLoadingMemories.set(false);
        }),
        catchError((err) => {
          this.isLoadingMemories.set(false);
          this.memoryEntries.set([]);
          return throwError(() => err);
        })
      );
  }

  createMemoryEntry(request: CreateMemoryEntryRequest): Observable<MemoryEntry> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    this.isSavingMemory.set(true);
    return this.http
      .post<MemoryEntry>(`/api/v1/workspaces/${wsId}/memory-entries`, request)
      .pipe(
        tap((newEntry) => {
          this.memoryEntries.update((prev) => [newEntry, ...prev]);
          this.isSavingMemory.set(false);
        }),
        catchError((err) => {
          this.isSavingMemory.set(false);
          return throwError(() => err);
        })
      );
  }

  updateMemoryEntry(id: string, request: UpdateMemoryEntryRequest): Observable<MemoryEntry> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    this.isSavingMemory.set(true);
    return this.http
      .put<MemoryEntry>(`/api/v1/workspaces/${wsId}/memory-entries/${id}`, request)
      .pipe(
        tap((updated) => {
          this.memoryEntries.update((prev) =>
            prev.map((m) => (m.id === id ? updated : m))
          );
          this.isSavingMemory.set(false);
        }),
        catchError((err) => {
          this.isSavingMemory.set(false);
          return throwError(() => err);
        })
      );
  }

  deleteMemoryEntry(id: string): Observable<void> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    return this.http
      .delete<void>(`/api/v1/workspaces/${wsId}/memory-entries/${id}`)
      .pipe(
        tap(() => {
          this.memoryEntries.update((prev) => prev.filter((m) => m.id !== id));
        })
      );
  }

  fetchConversations(): Observable<ConversationsApiResponse | null> {
    const wsId = this.wsId;
    if (!wsId) {
      this.conversations.set([]);
      return of(null);
    }

    this.isLoadingConversations.set(true);
    const params = new HttpParams().set('page', '0').set('size', '50');

    return this.http
      .get<ConversationsApiResponse>(`/api/v1/workspaces/${wsId}/conversations`, { params })
      .pipe(
        tap((res) => {
          const items = (res?.data || []).map((c: any) => ({
            ...c,
            id: c.id || c.conversationId,
            conversationId: c.conversationId || c.id,
          }));
          this.conversations.set(items);
          this.isLoadingConversations.set(false);
        }),
        catchError((err) => {
          this.isLoadingConversations.set(false);
          this.conversations.set([]);
          return throwError(() => err);
        })
      );
  }

  fetchConversationTurns(conversationId: string): Observable<ConversationTurn[]> {
    const wsId = this.wsId;
    if (!wsId || !conversationId || conversationId === 'undefined') {
      this.activeConversationTurns.set([]);
      return of([]);
    }

    this.activeConversationId.set(conversationId);
    this.isLoadingTurns.set(true);

    return this.http
      .get<ConversationTurn[]>(
        `/api/v1/workspaces/${wsId}/conversations/${conversationId}/turns?limit=100`
      )
      .pipe(
        tap((turns) => {
          const items = (turns || []).map((t: any) => ({
            ...t,
            id: t.id || t.turnId,
            turnId: t.turnId || t.id,
          }));
          this.activeConversationTurns.set(items);
          this.isLoadingTurns.set(false);
        }),
        catchError((err) => {
          this.isLoadingTurns.set(false);
          this.activeConversationTurns.set([]);
          return throwError(() => err);
        })
      );
  }

  clearConversationHistory(conversationId: string): Observable<void> {
    const wsId = this.wsId;
    if (!wsId || !conversationId || conversationId === 'undefined') return of(undefined);

    return this.http
      .post<void>(`/api/v1/workspaces/${wsId}/conversations/${conversationId}/clear`, {})
      .pipe(
        tap(() => {
          if (this.activeConversationId() === conversationId) {
            this.activeConversationTurns.set([]);
          }
        })
      );
  }

  deleteConversation(conversationId: string): Observable<void> {
    const wsId = this.wsId;
    if (!wsId || !conversationId || conversationId === 'undefined') return of(undefined);

    return this.http
      .delete<void>(`/api/v1/workspaces/${wsId}/conversations/${conversationId}`)
      .pipe(
        tap(() => {
          this.conversations.update((prev) =>
            prev.filter((c) => c.id !== conversationId && c.conversationId !== conversationId)
          );
          if (this.activeConversationId() === conversationId) {
            this.activeConversationId.set(null);
            this.activeConversationTurns.set([]);
          }
        })
      );
  }
}
