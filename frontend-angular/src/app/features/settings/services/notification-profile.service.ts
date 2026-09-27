import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { NotificationProfile } from '../models/settings.models';
import { WorkspaceContextService } from '@core/services/workspace-context.service';

const DEFAULT_PROFILE: NotificationProfile = {
  emailAddress: '',
  slackWebhookRef: '',
  consentPolicy: 'DISABLED',
  digestSchedule: '0 8 * * *',
  channelRoutingMap: {
    Critical: ['InApp', 'Email', 'Slack'],
    Urgent: ['InApp', 'Email'],
    Normal: ['InApp'],
    Low: ['InApp'],
  },
};

@Injectable({
  providedIn: 'root',
})
export class NotificationProfileService {
  private readonly http = inject(HttpClient);
  private readonly workspaceService = inject(WorkspaceContextService);

  readonly profile = signal<NotificationProfile>(DEFAULT_PROFILE);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);

  private get wsId(): string {
    return this.workspaceService.activeWorkspaceId() || '';
  }

  fetchProfile(): Observable<NotificationProfile> {
    const wsId = this.wsId;
    if (!wsId) return of(this.profile());

    this.isLoading.set(true);
    return this.http
      .get<NotificationProfile>(`/api/v1/workspaces/${wsId}/notification-profile`)
      .pipe(
        tap((data) => {
          this.profile.set({
            emailAddress: data.emailAddress || '',
            slackWebhookRef: data.slackWebhookRef || '',
            consentPolicy: data.consentPolicy || 'DISABLED',
            digestSchedule: data.digestSchedule || '0 8 * * *',
            channelRoutingMap: data.channelRoutingMap || DEFAULT_PROFILE.channelRoutingMap,
          });
          this.isLoading.set(false);
        }),
        catchError((err) => {
          console.warn('[NotificationProfileService] Fetch failed:', err);
          this.isLoading.set(false);
          return of(this.profile());
        })
      );
  }

  updateProfile(payload: NotificationProfile): Observable<boolean> {
    const wsId = this.wsId;
    if (!wsId) return of(false);

    this.isSaving.set(true);
    return this.http
      .put<NotificationProfile>(`/api/v1/workspaces/${wsId}/notification-profile`, payload)
      .pipe(
        tap((data) => {
          this.profile.set(data);
          this.isSaving.set(false);
        }),
        map(() => true),
        catchError((err) => {
          console.error('[NotificationProfileService] Update failed:', err);
          this.isSaving.set(false);
          return of(false);
        })
      );
  }
}
