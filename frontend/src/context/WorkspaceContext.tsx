import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Workspace {
  id: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  selectWorkspace: (id: string) => void;
  createWorkspace: (name: string) => Promise<Workspace>;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// Default mock workspaces for initial startup
const DEFAULT_WORKSPACES: Workspace[] = [
  { id: 'workspace-demo-uuid', name: "Jane's Workspace", status: 'ACTIVE' },
  { id: 'workspace-marketing-uuid', name: 'Marketing Workspace', status: 'ACTIVE' },
  { id: 'workspace-suspended-uuid', name: 'Archived Workspace', status: 'SUSPENDED' },
];

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(DEFAULT_WORKSPACES);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedWorkspaceId = localStorage.getItem('active_workspace_id');
    const found = workspaces.find(w => w.id === storedWorkspaceId);
    
    if (found) {
      setActiveWorkspace(found);
    } else if (workspaces.length > 0) {
      // Default to first active workspace if none stored
      const firstActive = workspaces.find(w => w.status === 'ACTIVE') || workspaces[0];
      setActiveWorkspace(firstActive);
      localStorage.setItem('active_workspace_id', firstActive.id);
    }
    setIsLoading(false);
  }, [workspaces]);

  const selectWorkspace = (id: string) => {
    const target = workspaces.find(w => w.id === id);
    if (target) {
      setActiveWorkspace(target);
      localStorage.setItem('active_workspace_id', id);
      // Clear conversation state or trigger a sync if needed in real app
    }
  };

  const createWorkspace = async (name: string): Promise<Workspace> => {
    // Mimic API creation call
    const newWs: Workspace = {
      id: `workspace-${Math.random().toString(36).substr(2, 9)}`,
      name,
      status: 'ACTIVE'
    };
    
    setWorkspaces(prev => [...prev, newWs]);
    setActiveWorkspace(newWs);
    localStorage.setItem('active_workspace_id', newWs.id);
    return newWs;
  };

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, selectWorkspace, createWorkspace, isLoading }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
