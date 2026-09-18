import React from 'react';
import { Shield, CheckCircle2, Play, ExternalLink } from 'lucide-react';

export const SecurityGateFooter: React.FC = () => {
  return (
    <div className="card interactive-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Shield
          size={22}
          style={{ color: 'var(--color-primary)' }}
          aria-hidden="true"
        />
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
          Human-in-the-Loop Security Gate
        </h3>
      </div>
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '15px',
          margin: 0,
          lineHeight: '1.6',
        }}
      >
        Mọi quyết định xóa hoặc ghi đè lịch quan trọng của Agent sẽ được đưa qua
        luồng Phê duyệt thủ công (Human Approval Queue) để đảm bảo an toàn tuyệt
        đối.
      </p>

      <div
        style={{
          backgroundColor: 'var(--bg-app)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <CheckCircle2
          size={20}
          style={{ color: 'var(--color-success)', flexShrink: 0 }}
          aria-hidden="true"
        />
        <span style={{ fontSize: '15px', color: 'var(--text-main)' }}>
          System Status:{' '}
          <strong style={{ color: 'var(--color-success)' }}>Ready</strong>. Tool
          registry synchronized with local plugins.
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          marginTop: '12px',
        }}
      >
        <button
          className="btn btn-primary"
          onClick={() => alert('Starting a new AI Executive Agent session...')}
        >
          <Play size={15} aria-hidden="true" />
          <span>Initialize Session</span>
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => alert('Loading local tool registries...')}
        >
          <span>View Tool Registry</span>
          <ExternalLink size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
