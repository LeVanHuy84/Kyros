import { Injectable, signal } from '@angular/core';

export interface WorkspaceSummary {
  id: string;
  name: string;
  role: string;
  isPrimary?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class WorkspaceContextService {
  private readonly STORAGE_KEY = 'kyros_active_workspace_id';

  readonly activeWorkspaceId = signal<string | null>(this.getInitialWorkspaceId());
  readonly activeWorkspace = signal<WorkspaceSummary | null>(null);
  readonly workspaces = signal<WorkspaceSummary[]>([]);

  private getInitialWorkspaceId(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  setActiveWorkspace(workspace: WorkspaceSummary): void {
    this.activeWorkspaceId.set(workspace.id);
    this.activeWorkspace.set(workspace);
    localStorage.setItem(this.STORAGE_KEY, workspace.id);
  }

  setActiveWorkspaceId(id: string): void {
    this.activeWorkspaceId.set(id);
    localStorage.setItem(this.STORAGE_KEY, id);
    const found = this.workspaces().find((w) => w.id === id);
    if (found) {
      this.activeWorkspace.set(found);
    }
  }

  setWorkspaces(list: WorkspaceSummary[]): void {
    this.workspaces.set(list);
    const currentId = this.activeWorkspaceId();
    if (currentId) {
      const found = list.find((w) => w.id === currentId);
      if (found) {
        this.activeWorkspace.set(found);
        return;
      }
    }
    // Fallback to primary or first
    const primary = list.find((w) => w.isPrimary) || list[0];
    if (primary) {
      this.setActiveWorkspace(primary);
    }
  }

  clear(): void {
    this.activeWorkspaceId.set(null);
    this.activeWorkspace.set(null);
    this.workspaces.set([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
