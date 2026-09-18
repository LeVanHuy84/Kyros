import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api-client';
import { useWorkspace } from './useWorkspace';

export interface UserAiConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  hasSavedKey: boolean;
}

export const PROVIDER_PRESETS: Record<
  string,
  { baseUrl: string; model: string; name: string }
> = {
  groq: {
    name: '🚀 Groq (Free Tier)',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
  },
  gemini: {
    name: '✨ Google Gemini (Free Tier)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model: 'gemini-1.5-flash',
  },
  xkiro: {
    name: '🤖 xAI / XKiro',
    baseUrl: 'https://api.xkiro.com/v1',
    model: 'mistralai/mistral-small-2603',
  },
  ollama: {
    name: '🦙 Local Ollama (Offline)',
    baseUrl: 'http://localhost:11434/v1',
    model: 'qwen2.5:1.5b',
  },
  openrouter: {
    name: '🌐 OpenRouter / OpenAI',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4o-mini',
  },
};

export const useAiSettings = () => {
  const { activeWorkspace } = useWorkspace();
  const [config, setConfig] = useState<UserAiConfig>({
    provider: 'groq',
    apiKey: '',
    baseUrl: PROVIDER_PRESETS.groq.baseUrl,
    model: PROVIDER_PRESETS.groq.model,
    hasSavedKey: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const workspaceId =
    activeWorkspace?.id || '00000000-0000-0000-0000-000000000001';

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<UserAiConfig>(
        `/v1/workspaces/${workspaceId}/agent/ai-config`
      );
      if (response.data) {
        setConfig(response.data);
      }
    } catch (err: any) {
      setError(
        err.friendlyMessage || 'Không thể tải cấu hình AI Vault từ server.'
      );
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveConfig = async (newConfig: Partial<UserAiConfig>) => {
    setSaving(true);
    setError(null);
    try {
      const updatedData = { ...config, ...newConfig };
      const response = await apiClient.put<UserAiConfig>(
        `/v1/workspaces/${workspaceId}/agent/ai-config`,
        updatedData
      );
      if (response.data) {
        setConfig(response.data);
      }
      return response.data;
    } catch (err: any) {
      const msg = err.friendlyMessage || 'Không thể lưu cấu hình AI Vault.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  };

  const changeProvider = (providerKey: string) => {
    const preset = PROVIDER_PRESETS[providerKey];
    if (preset) {
      setConfig((prev) => ({
        ...prev,
        provider: providerKey,
        baseUrl: preset.baseUrl,
        model: preset.model,
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        provider: providerKey,
      }));
    }
  };

  return {
    config,
    setConfig,
    loading,
    saving,
    error,
    fetchConfig,
    saveConfig,
    changeProvider,
    presets: PROVIDER_PRESETS,
  };
};
