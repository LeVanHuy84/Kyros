import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { AiConfig, AI_PRESETS } from '../models/settings.models';
import { WorkspaceService } from '@core/workspace/services/workspace.service';

@Injectable({
  providedIn: 'root',
})
export class AiSettingsService {
  private readonly http = inject(HttpClient);
  private readonly workspaceService = inject(WorkspaceService);

  readonly config = signal<AiConfig>({
    provider: 'GEMINI',
    hasSavedKey: false,
    baseUrl: 'https://generativelanguage.googleapis.com',
    model: 'gemini-1.5-pro',
  });

  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly presets = AI_PRESETS;

  readonly hasSavedKey = computed(() => this.config().hasSavedKey);

  /**
   * Fetches AI Provider configuration for the active workspace.
   */
  fetchConfig(): Observable<AiConfig> {
    const wsId = this.workspaceService.activeWorkspaceId();
    if (!wsId) {
      return of(this.config());
    }

    this.isLoading.set(true);
    return this.http.get<AiConfig>(`/api/v1/workspaces/${wsId}/agent/ai-config`).pipe(
      tap((cfg) => {
        if (cfg) {
          this.config.set(cfg);
        }
        this.isLoading.set(false);
      }),
      catchError((err) => {
        this.isLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  /**
   * Saves or updates AI Provider configuration into Backend Vault.
   */
  saveConfig(payload: Partial<AiConfig>): Observable<AiConfig> {
    const wsId = this.workspaceService.activeWorkspaceId();
    if (!wsId) return throwError(() => new Error('No active workspace'));

    this.isSaving.set(true);
    return this.http.put<AiConfig>(`/api/v1/workspaces/${wsId}/agent/ai-config`, payload).pipe(
      tap((updated) => {
        this.config.set(updated);
        this.isSaving.set(false);
      }),
      catchError((err) => {
        this.isSaving.set(false);
        return throwError(() => err);
      })
    );
  }
}
