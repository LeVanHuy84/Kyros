import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { UserPreferences } from '../models/settings.models';
import { WorkspaceContextService } from '@core/services/workspace-context.service';

const DEFAULT_PREFERENCES: UserPreferences = {
  timezone: 'Asia/Ho_Chi_Minh',
  defaultPriority: 'Medium',
  preventCalendarOverlap: false,
  leadTimeMinutes: 15,
};

@Injectable({
  providedIn: 'root',
})
export class UserPreferencesService {
  private readonly http = inject(HttpClient);
  private readonly workspaceService = inject(WorkspaceContextService);

  readonly preferences = signal<UserPreferences>(DEFAULT_PREFERENCES);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);

  private get wsId(): string {
    return this.workspaceService.activeWorkspaceId() || '';
  }

  fetchPreferences(): Observable<UserPreferences> {
    const wsId = this.wsId;
    if (!wsId) return of(this.preferences());

    this.isLoading.set(true);
    return this.http
      .get<UserPreferences>(`/api/v1/workspaces/${wsId}/preferences`)
      .pipe(
        tap((data) => {
          this.preferences.set({
            timezone: data.timezone || 'Asia/Ho_Chi_Minh',
            defaultPriority: data.defaultPriority || 'Medium',
            preventCalendarOverlap: !!data.preventCalendarOverlap,
            leadTimeMinutes: data.leadTimeMinutes || 15,
          });
          this.isLoading.set(false);
        }),
        catchError((err) => {
          console.warn('[UserPreferencesService] Fetch failed:', err);
          this.isLoading.set(false);
          return of(this.preferences());
        })
      );
  }

  updatePreferences(payload: UserPreferences): Observable<boolean> {
    const wsId = this.wsId;
    if (!wsId) return of(false);

    this.isSaving.set(true);
    return this.http
      .put<UserPreferences>(`/api/v1/workspaces/${wsId}/preferences`, payload)
      .pipe(
        tap((data) => {
          this.preferences.set(data);
          this.isSaving.set(false);
        }),
        map(() => true),
        catchError((err) => {
          console.error('[UserPreferencesService] Update failed:', err);
          this.isSaving.set(false);
          return of(false);
        })
      );
  }

  resetPreferences(): Observable<boolean> {
    const wsId = this.wsId;
    if (!wsId) return of(false);

    this.isSaving.set(true);
    return this.http
      .post<UserPreferences>(`/api/v1/workspaces/${wsId}/preferences/reset`, {})
      .pipe(
        tap((data) => {
          this.preferences.set(data);
          this.isSaving.set(false);
        }),
        map(() => true),
        catchError((err) => {
          console.error('[UserPreferencesService] Reset failed:', err);
          this.isSaving.set(false);
          return of(false);
        })
      );
  }
}
