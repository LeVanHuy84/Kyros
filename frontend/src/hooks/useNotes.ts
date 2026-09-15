import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from './useWorkspace';
import apiClient from '../services/api-client';

export interface Note {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  content: string;
  taskId: string | null;
  eventId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useNotes = () => {
  const { activeWorkspace } = useWorkspace();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(
        `/v1/workspaces/${activeWorkspace.id}/notes`
      );
      setNotes(response.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.friendlyMessage || 'Failed to load notes.');
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const createNote = async (
    title: string,
    content: string,
    taskId?: string | null,
    eventId?: string | null
  ) => {
    if (!activeWorkspace) return;
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.post(`/v1/workspaces/${activeWorkspace.id}/notes`, {
        title: title.trim(),
        content: content ? content.trim() : '',
        taskId: taskId || null,
        eventId: eventId || null,
      });
      await fetchNotes();
    } catch (err: any) {
      const msg = err.friendlyMessage || 'Failed to create note.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const updateNote = async (
    noteId: string,
    title: string,
    content: string,
    taskId?: string | null,
    eventId?: string | null
  ) => {
    if (!activeWorkspace) return;
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.put(
        `/v1/workspaces/${activeWorkspace.id}/notes/${noteId}`,
        {
          title: title.trim(),
          content: content ? content.trim() : '',
          taskId: taskId || null,
          eventId: eventId || null,
        }
      );
      await fetchNotes();
    } catch (err: any) {
      const msg = err.friendlyMessage || 'Failed to update note.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!activeWorkspace) return;
    setError(null);
    try {
      await apiClient.delete(
        `/v1/workspaces/${activeWorkspace.id}/notes/${noteId}`
      );
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to delete note.');
    }
  };

  return {
    notes,
    isLoading,
    isSaving,
    error,
    setError,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  };
};
