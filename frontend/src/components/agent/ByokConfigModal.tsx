import React from 'react';
import { Cpu, Lock, Settings, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ByokConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface ByokConfigModalProps {
  show: boolean;
  onClose: () => void;
}

export const ByokConfigModal: React.FC<ByokConfigModalProps> = ({
  show,
  onClose,
}) => {
  const navigate = useNavigate();

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          <Cpu size={16} style={{ color: 'var(--color-primary)' }} />
          <span>Quản lý Cấu hình AI Provider (Backend Vault)</span>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Lock size={12} /> AES-256 Vault Encrypted
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={16} />
        </button>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: '13px',
          color: 'var(--text-muted)',
          lineHeight: '1.5',
        }}
      >
        Để tăng cường bảo mật, toàn bộ cài đặt AI Provider & API Key đã được
        chuyển sang mục{' '}
        <strong style={{ color: 'var(--color-primary)' }}>
          Settings &gt; AI Provider & Vault
        </strong>
        . API Key sẽ được mã hóa an toàn ở phía Server.
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '8px',
          paddingTop: '4px',
        }}
      >
        <button
          className="btn btn-primary"
          onClick={() => {
            onClose();
            navigate('/settings');
          }}
          style={{
            padding: '6px 14px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Settings size={14} /> Chuyển tới Cài đặt AI Vault
        </button>
      </div>
    </div>
  );
};
