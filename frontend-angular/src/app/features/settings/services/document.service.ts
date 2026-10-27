import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { WorkspaceService } from '@core/workspace/services/workspace.service';
import { WorkspaceDocument } from '../models/document.models';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private readonly apiService = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly workspaceService = inject(WorkspaceService);
  private readonly baseUrl = environment.apiUrl;

  getDocuments(): Observable<WorkspaceDocument[]> {
    const wsId = this.workspaceService.activeWorkspaceId();
    if (!wsId) return new Observable((sub) => sub.next([]));
    return this.apiService.get<WorkspaceDocument[]>(`/v1/workspaces/${wsId}/documents`);
  }

  uploadDocument(file: File): Observable<WorkspaceDocument> {
    const wsId = this.workspaceService.activeWorkspaceId();
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<WorkspaceDocument>(
      `${this.baseUrl}/v1/workspaces/${wsId}/documents/upload`,
      formData
    );
  }

  deleteDocument(documentId: string): Observable<void> {
    const wsId = this.workspaceService.activeWorkspaceId();
    return this.apiService.delete<void>(`/v1/workspaces/${wsId}/documents/${documentId}`);
  }
}
