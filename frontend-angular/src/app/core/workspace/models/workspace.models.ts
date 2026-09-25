export type WorkspaceStatus = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

export interface Workspace {
  id: string;
  name: string;
  status: WorkspaceStatus;
  isPrimary?: boolean;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWorkspaceRequest {
  name: string;
}
