import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { CreateNoteRequest, Note, UpdateNoteRequest } from '../models/note.models';
import { WorkspaceContextService } from '@core/services/workspace-context.service';

export type NoteFilterTab = 'all' | 'pinned' | 'recent';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private readonly PINNED_STORAGE_PREFIX = 'kyros_pinned_notes_';
  private readonly http = inject(HttpClient);
  private readonly workspaceContext = inject(WorkspaceContextService);

  readonly notes = signal<Note[]>([]);
  readonly selectedNoteId = signal<string | null>(null);
  readonly filterTab = signal<NoteFilterTab>('all');
  readonly searchQuery = signal<string>('');
  readonly pinnedNoteIds = signal<Set<string>>(this.loadPinnedNoteIds());
  readonly isEditorMode = signal<boolean>(false);
  readonly isCreatingNew = signal<boolean>(false);

  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly lastSavedAt = signal<Date | null>(null);

  private get wsId(): string {
    return this.workspaceContext.activeWorkspaceId() || '';
  }

  readonly activeNote = computed<Note | null>(() => {
    const id = this.selectedNoteId();
    if (!id) return null;
    return this.notes().find((n) => n.id === id) || null;
  });

  readonly filteredNotes = computed<Note[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const tab = this.filterTab();
    const pinned = this.pinnedNoteIds();
    let list = this.notes();

    if (query) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          (n.content && n.content.toLowerCase().includes(query))
      );
    }

    if (tab === 'pinned') {
      list = list.filter((n) => pinned.has(n.id));
    }

    // Sort pinned notes first, then by updatedAt descending
    return [...list].sort((a, b) => {
      const aPinned = pinned.has(a.id) ? 1 : 0;
      const bPinned = pinned.has(b.id) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  });

  readonly pinnedCount = computed<number>(() => {
    const pinned = this.pinnedNoteIds();
    return this.notes().filter((n) => pinned.has(n.id)).length;
  });

  private loadPinnedNoteIds(): Set<string> {
    try {
      const ws = this.workspaceContext.activeWorkspaceId();
      if (!ws) return new Set();
      const saved = localStorage.getItem(this.PINNED_STORAGE_PREFIX + ws);
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
    return new Set();
  }

  private persistPinned(): void {
    const ws = this.workspaceContext.activeWorkspaceId();
    if (!ws) return;
    try {
      localStorage.setItem(
        this.PINNED_STORAGE_PREFIX + ws,
        JSON.stringify(Array.from(this.pinnedNoteIds()))
      );
    } catch {
      // Ignore
    }
  }

  togglePinNote(noteId: string): void {
    const current = new Set(this.pinnedNoteIds());
    if (current.has(noteId)) {
      current.delete(noteId);
    } else {
      current.add(noteId);
    }
    this.pinnedNoteIds.set(current);
    this.persistPinned();
  }

  isPinned(noteId: string): boolean {
    return this.pinnedNoteIds().has(noteId);
  }

  selectNote(noteId: string | null): void {
    this.selectedNoteId.set(noteId);
    this.isCreatingNew.set(false);
  }

  startCreatingNew(): void {
    this.selectedNoteId.set(null);
    this.isCreatingNew.set(true);
    this.isEditorMode.set(true);
  }

  cancelCreatingNew(): void {
    this.isCreatingNew.set(false);
    if (this.notes().length > 0 && !this.selectedNoteId()) {
      this.selectedNoteId.set(this.notes()[0].id);
    }
  }

  fetchNotes(): Observable<Note[]> {
    const wsId = this.wsId;
    if (!wsId) {
      this.notes.set([]);
      return of([]);
    }

    this.isLoading.set(true);
    return this.http.get<Note[]>(`/api/v1/workspaces/${wsId}/notes`).pipe(
      tap((list) => {
        const sorted = list || [];
        this.notes.set(sorted);
        this.isLoading.set(false);

        // Auto-select first note if none selected
        if (!this.selectedNoteId() && !this.isCreatingNew() && sorted.length > 0) {
          this.selectedNoteId.set(sorted[0].id);
        }
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.notes.set([]);
        return throwError(() => err);
      })
    );
  }

  createNote(request: CreateNoteRequest): Observable<Note> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    this.isSaving.set(true);
    return this.http.post<Note>(`/api/v1/workspaces/${wsId}/notes`, request).pipe(
      tap((newNote) => {
        this.notes.update((prev) => [newNote, ...prev]);
        this.selectedNoteId.set(newNote.id);
        this.isCreatingNew.set(false);
        this.isSaving.set(false);
        this.lastSavedAt.set(new Date());
      }),
      catchError((err) => {
        this.isSaving.set(false);
        return throwError(() => err);
      })
    );
  }

  updateNote(noteId: string, request: UpdateNoteRequest): Observable<Note> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    this.isSaving.set(true);
    return this.http.put<Note>(`/api/v1/workspaces/${wsId}/notes/${noteId}`, request).pipe(
      tap((updated) => {
        this.notes.update((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
        this.isSaving.set(false);
        this.lastSavedAt.set(new Date());
      }),
      catchError((err) => {
        this.isSaving.set(false);
        return throwError(() => err);
      })
    );
  }

  deleteNote(noteId: string): Observable<void> {
    const wsId = this.wsId;
    if (!wsId) return throwError(() => new Error('No active workspace'));

    return this.http.delete<void>(`/api/v1/workspaces/${wsId}/notes/${noteId}`).pipe(
      tap(() => {
        this.notes.update((prev) => prev.filter((n) => n.id !== noteId));
        if (this.selectedNoteId() === noteId) {
          const remaining = this.notes();
          this.selectedNoteId.set(remaining.length > 0 ? remaining[0].id : null);
        }
      })
    );
  }
}
