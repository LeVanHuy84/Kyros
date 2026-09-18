import React, { useState } from 'react';
import {
  Cpu,
  Lock,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAiSettings } from '../../hooks/useAiSettings';

interface AiConfigPanelProps {
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export const AiConfigPanel: React.FC<AiConfigPanelProps> = ({
  onSuccess,
  onError,
}) => {
  const {
    config,
    setConfig,
    loading,
    saving,
    error,
    saveConfig,
    changeProvider,
    presets,
  } = useAiSettings();
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [isEditingKey, setIsEditingKey] = useState<boolean>(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...config,
        apiKey: isEditingKey || !config.hasSavedKey ? apiKeyInput : '',
      };
      await saveConfig(payload);
      setIsEditingKey(false);
      setApiKeyInput('');
      if (onSuccess) {
        onSuccess(
          'Đã lưu cấu hình AI Provider vào Backend Vault mã hóa AES-256 an toàn!'
        );
      }
    } catch (err: any) {
      if (onError) {
        onError(err.message || 'Lỗi khi lưu cấu hình AI Vault.');
      }
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px',
        }}
      >
        <Loader2
          className="animate-spin"
          size={28}
          style={{ color: 'var(--color-primary)' }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '720px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={22} style={{ color: 'var(--color-primary)' }} />
          <h3
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--text-main)',
            }}
          >
            Cấu hình AI Provider & Backend Vault (BYOK)
          </h3>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--text-muted)',
            lineHeight: '1.6',
          }}
        >
          Cấu hình API Key của cá nhân bạn (Bring Your Own Key). Toàn bộ API Key
          được mã hóa chuẩn{' '}
          <strong style={{ color: 'var(--color-success)' }}>AES-256-GCM</strong>{' '}
          trong Backend Vault và không bao giờ lưu dưới dạng plain-text.
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #F87171',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            color: '#DC2626',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSave}
        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        {/* Preset Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-main)',
            }}
          >
            Chọn AI Provider Presets:
          </label>
          <select
            value={config.provider}
            onChange={(e) => changeProvider(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '14px',
            }}
          >
            {Object.entries(presets).map(([key, item]) => (
              <option key={key} value={key}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* API Key Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <label
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-main)',
              }}
            >
              API Key ({config.provider}):
            </label>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--color-success)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: '600',
              }}
            >
              <Lock size={12} /> Backend AES-256 Vault Encrypted
            </span>
          </div>

          {config.hasSavedKey && !isEditingKey ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <CheckCircle
                  size={16}
                  style={{ color: 'var(--color-success)' }}
                />
                <span
                  style={{
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    fontWeight: '600',
                  }}
                >
                  {config.apiKey || '🔒 ••••••••••••••••'}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsEditingKey(true);
                  setApiKeyInput('');
                }}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                Thay đổi Key
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <input
                type={showApiKey ? 'text' : 'password'}
                placeholder={
                  config.hasSavedKey
                    ? 'Nhập API key mới để thay thế...'
                    : 'Nhập API key cá nhân của bạn...'
                }
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          )}
        </div>

        {/* Base Endpoint URL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-main)',
            }}
          >
            Base Endpoint URL:
          </label>
          <input
            type="text"
            value={config.baseUrl}
            onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Model Target */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-main)',
            }}
          >
            Model Target:
          </label>
          <input
            type="text"
            value={config.model}
            onChange={(e) => setConfig({ ...config, model: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            paddingTop: '12px',
          }}
        >
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Đang lưu Vault...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Lưu Cấu Hình AI Vault</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
