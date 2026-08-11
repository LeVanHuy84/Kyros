import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import apiClient from '../services/api-client';

export interface WorkspaceTag {
  tagId: string;
  workspaceId: string;
  name: string;
  color: string | null;
  createdAt: string;
}

export const useWorkspaceTags = () => {
  const { activeWorkspace } = useWorkspace();

  const [tags, setTags] = useState<WorkspaceTag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/v1/workspaces/${activeWorkspace.id}/tags`);
      setTags(response.data || []);
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to load workspace tags.');
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace]);

  const createTag = useCallback(
    async (name: string, color: string | null) => {
      if (!activeWorkspace) return;
      setError(null);
      try {
        await apiClient.post(`/v1/workspaces/${activeWorkspace.id}/tags`, {
          name: name.trim(),
          color
        });
        await fetchTags();
      } catch (err: any) {
        const msg = err.friendlyMessage || 'Failed to create tag.';
        setError(msg);
        throw new Error(msg);
      }
    },
    [activeWorkspace, fetchTags]
  );

  const updateTag = useCallback(
    async (tagId: string, name: string, color: string | null) => {
      if (!activeWorkspace) return;
      setError(null);
      try {
        await apiClient.put(`/v1/workspaces/${activeWorkspace.id}/tags/${tagId}`, {
          name: name.trim(),
          color
        });
        await fetchTags();
      } catch (err: any) {
        const msg = err.friendlyMessage || 'Failed to update tag.';
        setError(msg);
        throw new Error(msg);
      }
    },
    [activeWorkspace, fetchTags]
  );

  const deleteTag = useCallback(
    async (tagId: string) => {
      if (!activeWorkspace) return;
      setError(null);
      try {
        await apiClient.delete(`/v1/workspaces/${activeWorkspace.id}/tags/${tagId}`);
        setTags(prev => prev.filter(t => t.tagId !== tagId));
      } catch (err: any) {
        const msg = err.friendlyMessage || 'Failed to delete tag.';
        setError(msg);
        throw new Error(msg);
      }
    },
    [activeWorkspace]
  );

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    tags,
    isLoading,
    error,
    setError,
    fetchTags,
    createTag,
    updateTag,
    deleteTag
  };
};
