import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from './useWorkspace';
import apiClient from '../services/api-client';
import type { Preferences } from '../types/memory';

export const usePreferences = () => {
  const { activeWorkspace } = useWorkspace();
  const [pref, setPref] = useState<Preferences>({
    timezone: 'UTC',
    defaultPriority: 'Medium',
    preventCalendarOverlap: false,
    leadTimeMinutes: 15,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(
        `/v1/workspaces/${activeWorkspace.id}/preferences`
      );
      setPref({
        timezone: res.data.timezone || 'UTC',
        defaultPriority: res.data.defaultPriority || 'Medium',
        preventCalendarOverlap: res.data.preventCalendarOverlap ?? false,
        leadTimeMinutes: res.data.leadTimeMinutes ?? 15,
      });
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace]);

  const savePreferences = async (updatedPref: Preferences) => {
    if (!activeWorkspace) return false;
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.put(
        `/v1/workspaces/${activeWorkspace.id}/preferences`,
        updatedPref
      );
      setPref(updatedPref);
      return true;
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to save preferences');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const resetPreferences = async () => {
    if (!activeWorkspace) return false;
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.post(
        `/v1/workspaces/${activeWorkspace.id}/preferences/reset`
      );
      await fetchPreferences();
      return true;
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to reset preferences');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    pref,
    setPref,
    isLoading,
    isSaving,
    error,
    setError,
    savePreferences,
    resetPreferences,
    refetch: fetchPreferences,
  };
};
