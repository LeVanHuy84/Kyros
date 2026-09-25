import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkspaceContextService } from './workspace-context.service';

export interface SseEvent<T = string> {
  event?: string;
  data: T;
  id?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SseService {
  private readonly workspaceService = inject(WorkspaceContextService);

  /**
   * Connects to an SSE endpoint using fetch and ReadableStream to support custom HTTP headers.
   */
  stream<T = string>(url: string, initHeaders?: Record<string, string>): Observable<SseEvent<T>> {
    return new Observable<SseEvent<T>>((observer) => {
      const abortController = new AbortController();
      const headers: Record<string, string> = {
        Accept: 'text/event-stream',
        ...initHeaders,
      };

      const token = localStorage.getItem('kyros_access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const activeWorkspaceId = this.workspaceService.activeWorkspaceId();
      if (activeWorkspaceId) {
        headers['X-Workspace-Id'] = activeWorkspaceId;
      }

      const fullUrl = url.startsWith('http') ? url : url;

      fetch(fullUrl, {
        headers,
        signal: abortController.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`SSE Connection failed with status ${response.status}: ${response.statusText}`);
          }
          if (!response.body) {
            throw new Error('ReadableStream not supported on response body');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              observer.complete();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const chunk of lines) {
              if (chunk.trim()) {
                const event = this.parseSseChunk<T>(chunk);
                if (event) {
                  observer.next(event);
                }
              }
            }
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            observer.error(err);
          }
        });

      return () => {
        abortController.abort();
      };
    });
  }

  private parseSseChunk<T>(chunk: string): SseEvent<T> | null {
    const lines = chunk.split('\n');
    let eventName: string | undefined;
    let dataStr = '';
    let id: string | undefined;

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        dataStr += (dataStr ? '\n' : '') + line.substring(5).trim();
      } else if (line.startsWith('id:')) {
        id = line.substring(3).trim();
      }
    }

    if (!dataStr && !eventName) {
      return null;
    }

    let parsedData: any = dataStr;
    try {
      parsedData = JSON.parse(dataStr);
    } catch {
      // Return raw string if not valid JSON
    }

    return {
      event: eventName,
      data: parsedData as T,
      id,
    };
  }
}
