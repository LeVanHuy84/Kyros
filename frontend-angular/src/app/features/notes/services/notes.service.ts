import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { CreateNoteRequest, Note, UpdateNoteRequest } from '../models/note.models';
import { WorkspaceService } from '@core/workspace/services/workspace.service';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private readonly http = inject(HttpClient);
  private readonly workspaceService = inject(WorkspaceService);

  readonly notes = signal<Note[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);

  /**
   * Fetches notes for the active workspace.
   */
  fetchNotes(): Observable<Note[]> {
    const wsId = this.workspaceService.activeWorkspaceId();
    if (!wsId) {
      this.notes.set([]);
      return of([]);
    }

    this.isLoading.set(true);
    return this.http.get<Note[]>(`/api/v1/workspaces/${wsId}/notes`).pipe(
      tap((list) => {
        this.notes.set(list || []);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.notes.set([]);
        return throwError(() => err);
      })
    );
  }

  createNote(request: CreateNoteRequest): Observable<Note> {
    const wsId = this.workspaceService.activeWorkspaceId();
    if (!wsId) return throwError(() => new Error('No active workspace'));

    this.isSaving.set(true);
    return this.http.post<Note>(`/api/v1/workspaces/${wsId}/notes`, request).pipe(
      tap((newNote) => {
        this.notes.update((prev) => [newNote, ...prev]);
        this.isSaving.set(false);
      }),
      catchError((err) => {
        this.isSaving.set(false);
        return throwError(() => err);
      })
    );
  }

  updateNote(noteId: string, request: UpdateNoteRequest): Observable<Note> {
    const wsId = this.workspaceService.activeWorkspaceId();
    if (!wsId) return throwError(() => new Error('No active workspace'));

    this.isSaving.set(true);
    return this.http.put<Note>(`/api/v1/workspaces/${wsId}/notes/${noteId}`, request).pipe(
      tap((updated) => {
        this.notes.update((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
        this.isSaving.set(false);
      }),
      catchError((err) => {
        this.isSaving.set(false);
        return throwError(() => err);
      })
    );
  }

  deleteNote(noteId: string): Observable<void> {
    const wsId = this.workspaceService.activeWorkspaceId();
    if (!wsId) return throwError(() => new Error('No active workspace'));

    return this.http.delete<void>(`/api/v1/workspaces/${wsId}/notes/${noteId}`).pipe(
      tap(() => {
        this.notes.update((prev) => prev.filter((n) => n.id !== noteId));
      })
    );
  }
}
