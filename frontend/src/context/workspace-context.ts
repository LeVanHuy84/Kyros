import { createContext } from 'react';

export interface Workspace {
  id: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  selectWorkspace: (id: string) => void;
  createWorkspace: (name: string) => Promise<Workspace>;
  isLoading: boolean;
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);
