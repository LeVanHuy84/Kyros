import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { Workspace } from '../models/workspace.models';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly STORAGE_KEY = 'kyros_active_workspace_id';

  readonly workspaces = signal<Workspace[]>([]);
  readonly activeWorkspace = signal<Workspace | null>(null);
  readonly isLoading = signal<boolean>(false);

  readonly activeWorkspaceId = computed(() => this.activeWorkspace()?.id || this.getStoredWorkspaceId());
  readonly hasWorkspaces = computed(() => this.workspaces().length > 0);

  constructor() {
    // Restore stored workspace if available
    const storedId = this.getStoredWorkspaceId();
    if (storedId) {
      this.activeWorkspace.set({
        id: storedId,
        name: 'Workspace',
        status: 'ACTIVE',
      });
    }
  }

  private getStoredWorkspaceId(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  /**
   * Fetches user workspaces and selects primary or active workspace.
   */
  fetchWorkspaces(): Observable<Workspace[]> {
    this.isLoading.set(true);
    return this.http.get<Workspace[]>('/api/workspaces').pipe(
      tap((list) => {
        const activeList = list || [];
        this.workspaces.set(activeList);

        if (activeList.length > 0) {
          // Attempt to fetch primary workspace
          this.http.get<Workspace>('/api/workspaces/primary').pipe(
            catchError(() => of(null))
          ).subscribe((primary) => {
            const foundPrimary = primary ? activeList.find((w) => w.id === primary.id) : null;
            const storedId = this.getStoredWorkspaceId();
            const foundStored = storedId ? activeList.find((w) => w.id === storedId && w.status === 'ACTIVE') : null;

            const selected = foundPrimary || foundStored || activeList.find((w) => w.status === 'ACTIVE') || activeList[0];
            if (selected) {
              this.setActive(selected);
            }
          });
        } else {
          this.activeWorkspace.set(null);
          localStorage.removeItem(this.STORAGE_KEY);
        }
      }),
      tap({
        finalize: () => this.isLoading.set(false),
      }),
      catchError((err) => {
        this.isLoading.set(false);
        this.workspaces.set([]);
        this.activeWorkspace.set(null);
        return throwError(() => err);
      })
    );
  }

  /**
   * Selects an active workspace by ID and updates primary workspace on backend.
   */
  selectWorkspace(id: string): Observable<void> {
    const target = this.workspaces().find((w) => w.id === id);
    if (target && target.status === 'ACTIVE') {
      this.setActive(target);
      return this.http.post<void>(`/api/workspaces/primary/${id}`, {}).pipe(
        catchError((err) => {
          console.warn('Could not persist primary workspace to backend', err);
          return of(undefined);
        })
      );
    }
    return of(undefined);
  }

  /**
   * Creates a new workspace and sets it as the active/primary one.
   */
  createWorkspace(name: string): Observable<Workspace> {
    return this.http.post<Workspace>('/api/workspaces', { name }).pipe(
      tap((newWs) => {
        const updated = [...this.workspaces(), newWs];
        this.workspaces.set(updated);
        this.setActive(newWs);
        // Persist primary on backend
        this.http.post(`/api/workspaces/primary/${newWs.id}`, {}).pipe(
          catchError(() => of(null))
        ).subscribe();
      })
    );
  }

  private setActive(ws: Workspace): void {
    this.activeWorkspace.set(ws);
    localStorage.setItem(this.STORAGE_KEY, ws.id);
  }

  /**
   * Clears state upon logout.
   */
  clear(): void {
    this.workspaces.set([]);
    this.activeWorkspace.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
