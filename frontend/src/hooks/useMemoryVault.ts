import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from './useWorkspace';
import apiClient from '../services/api-client';
import type { MemoryEntry } from '../types/memory';

export const useMemoryVault = () => {
  const { activeWorkspace } = useWorkspace();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page,
        size: 10,
      };
      if (searchQuery.trim()) {
        params.query = searchQuery.trim();
      }
      const res = await apiClient.get(`/v1/workspaces/${activeWorkspace.id}/memory-entries`, { params });
      setMemories(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to load memory entries');
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, searchQuery, page]);

  const updateMemory = async (id: string, content: string, confidenceScore: number) => {
    if (!activeWorkspace) return false;
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.put(`/v1/workspaces/${activeWorkspace.id}/memory-entries/${id}`, {
        content,
        confidenceScore,
      });
      await fetchMemories();
      return true;
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to update memory');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMemory = async (id: string) => {
    if (!activeWorkspace) return false;
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.delete(`/v1/workspaces/${activeWorkspace.id}/memory-entries/${id}`);
      await fetchMemories();
      return true;
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to delete memory');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories, page]);

  return {
    memories,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    isLoading,
    isSaving,
    error,
    setError,
    updateMemory,
    deleteMemory,
    refetch: fetchMemories,
  };
};
