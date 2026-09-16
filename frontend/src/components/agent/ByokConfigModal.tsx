import React from 'react';
import { Cpu, Lock, Save } from 'lucide-react';

export interface ByokConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface ByokConfigModalProps {
  show: boolean;
  byokConfig: ByokConfig;
  presets: Record<string, { baseUrl: string; model: string; name: string }>;
  onProviderChange: (providerKey: string) => void;
  onConfigChange: (newConfig: ByokConfig) => void;
  onClose: () => void;
}

export const ByokConfigModal: React.FC<ByokConfigModalProps> = ({
  show,
  byokConfig,
  presets,
  onProviderChange,
  onConfigChange,
  onClose,
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-app)',
        border: '1px solid var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '14px' }}>
        <Cpu size={16} style={{ color: 'var(--color-primary)' }} />
        <span>Cấu hình AI Provider & API Key (BYOK):</span>
        <span style={{ fontSize: '11px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Lock size={12} /> AES-256 & HTTP Header Encrypted
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chọn Provider Presets:</label>
          <select
            value={byokConfig.provider}
            onChange={(e) => onProviderChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
            }}
          >
            {Object.entries(presets).map(([key, item]) => (
              <option key={key} value={key}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>API Key ({byokConfig.provider}):</label>
          <input
            type="password"
            placeholder="Nhập API key cá nhân của bạn..."
            value={byokConfig.apiKey}
            onChange={(e) => onConfigChange({ ...byokConfig, apiKey: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Base Endpoint URL:</label>
          <input
            type="text"
            value={byokConfig.baseUrl}
            onChange={(e) => onConfigChange({ ...byokConfig, baseUrl: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Model Target:</label>
          <input
            type="text"
            value={byokConfig.model}
            onChange={(e) => onConfigChange({ ...byokConfig, model: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
        <button
          className="btn btn-primary"
          onClick={onClose}
          style={{ padding: '4px 12px', fontSize: '12px', gap: '4px' }}
        >
          <Save size={13} /> Lưu & Đóng
        </button>
      </div>
    </div>
  );
};
