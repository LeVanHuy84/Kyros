import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { ExecutiveBriefingData } from '../models/briefing.models';
import { WorkspaceService } from '@core/workspace/services/workspace.service';

@Injectable({
  providedIn: 'root',
})
export class ExecutiveBriefingService {
  private readonly http = inject(HttpClient);
  private readonly workspaceService = inject(WorkspaceService);

  readonly briefing = signal<ExecutiveBriefingData | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isGenerating = signal<boolean>(false);

  /**
   * Fetches today's executive daily briefing.
   */
  getTodayBriefing(): Observable<ExecutiveBriefingData> {
    const wsId = this.workspaceService.activeWorkspaceId();
    if (!wsId) return throwError(() => new Error('No active workspace'));

    this.isLoading.set(true);
    return this.http
      .get<ExecutiveBriefingData>(`/api/v1/workspaces/${wsId}/executive/briefing/today`)
      .pipe(
        tap((data) => {
          this.briefing.set(data);
          this.isLoading.set(false);
        }),
        catchError((err) => {
          this.isLoading.set(false);
          return throwError(() => err);
        })
      );
  }

  /**
   * Generates or regenerates fresh executive daily briefing.
   */
  generateBriefing(): Observable<ExecutiveBriefingData> {
    const wsId = this.workspaceService.activeWorkspaceId();
    if (!wsId) return throwError(() => new Error('No active workspace'));

    this.isGenerating.set(true);
    return this.http
      .post<ExecutiveBriefingData>(
        `/api/v1/workspaces/${wsId}/executive/briefing/generate`,
        {}
      )
      .pipe(
        tap((data) => {
          this.briefing.set(data);
          this.isGenerating.set(false);
        }),
        catchError((err) => {
          this.isGenerating.set(false);
          return throwError(() => err);
        })
      );
  }
}
