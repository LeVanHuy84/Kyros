import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from './useWorkspace';
import apiClient from '../services/api-client';
import type { Conversation, ConversationTurn } from '../types/memory';

export const useConversations = () => {
  const { activeWorkspace } = useWorkspace();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = { page, size: 10 };
      const res = await apiClient.get(`/v1/workspaces/${activeWorkspace.id}/conversations`, { params });
      setConversations(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, page]);

  const clearConversation = async (id: string) => {
    if (!activeWorkspace) return false;
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.post(`/v1/workspaces/${activeWorkspace.id}/conversations/${id}/clear`);
      await fetchConversations();
      return true;
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to clear conversation');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const getConversationTurns = async (id: string): Promise<ConversationTurn[]> => {
    if (!activeWorkspace) return [];
    try {
      const res = await apiClient.get(`/v1/workspaces/${activeWorkspace.id}/conversations/${id}/turns`);
      return res.data || [];
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to load conversation turns');
      return [];
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, page]);

  return {
    conversations,
    page,
    setPage,
    totalPages,
    isLoading,
    isSaving,
    error,
    setError,
    clearConversation,
    getConversationTurns,
    refetch: fetchConversations,
  };
};
