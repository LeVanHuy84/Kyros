import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api-client';
import { useAuth } from './AuthContext';

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

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true);
      // Fetch all workspaces assigned to the user
      const response = await apiClient.get('/workspaces');
      const wsList: Workspace[] = response.data.map((w: any) => ({
        id: w.id,
        name: w.name,
        status: w.status,
      }));
      setWorkspaces(wsList);

      if (wsList.length > 0) {
        try {
          // Attempt to retrieve primary workspace configuration
          const primaryResponse = await apiClient.get('/workspaces/primary');
          const primaryWs = wsList.find(
            (w) => w.id === primaryResponse.data.id
          );
          if (primaryWs && primaryWs.status === 'ACTIVE') {
            setActiveWorkspace(primaryWs);
            localStorage.setItem('active_workspace_id', primaryWs.id);
          } else {
            fallbackSelect(wsList);
          }
        } catch {
          // If primary workspace is not set/found, fallback
          fallbackSelect(wsList);
        }
      } else {
        setActiveWorkspace(null);
        localStorage.removeItem('active_workspace_id');
      }
    } catch (error) {
      console.error('Failed to fetch workspaces from server', error);
      setWorkspaces([]);
      setActiveWorkspace(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackSelect = (wsList: Workspace[]) => {
    const storedWorkspaceId = localStorage.getItem('active_workspace_id');
    const storedWs = wsList.find((w) => w.id === storedWorkspaceId);

    if (storedWs && storedWs.status === 'ACTIVE') {
      setActiveWorkspace(storedWs);
    } else {
      const firstActive =
        wsList.find((w) => w.status === 'ACTIVE') || wsList[0];
      setActiveWorkspace(firstActive || null);
      if (firstActive) {
        localStorage.setItem('active_workspace_id', firstActive.id);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces();
    } else {
      setWorkspaces([]);
      setActiveWorkspace(null);
      setIsLoading(false);
      localStorage.removeItem('active_workspace_id');
    }
  }, [isAuthenticated]);

  const selectWorkspace = async (id: string) => {
    const target = workspaces.find((w) => w.id === id);
    if (target && target.status === 'ACTIVE') {
      setActiveWorkspace(target);
      localStorage.setItem('active_workspace_id', id);
      try {
        // Persist primary workspace configuration to backend
        await apiClient.post(`/workspaces/primary/${id}`);
      } catch (e) {
        console.warn('Failed to update primary workspace on server', e);
      }
    }
  };

  const createWorkspace = async (name: string): Promise<Workspace> => {
    const response = await apiClient.post('/workspaces', { name });
    const newWs: Workspace = {
      id: response.data.id,
      name: response.data.name,
      status: response.data.status,
    };

    setWorkspaces((prev) => [...prev, newWs]);
    setActiveWorkspace(newWs);
    localStorage.setItem('active_workspace_id', newWs.id);

    try {
      // Auto-set as primary
      await apiClient.post(`/workspaces/primary/${newWs.id}`);
    } catch (e) {
      console.warn('Failed to set newly created workspace as primary', e);
    }

    return newWs;
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        selectWorkspace,
        createWorkspace,
        isLoading,
      }}
    >
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
