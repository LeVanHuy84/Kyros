import React from 'react';
import { Shield, CheckCircle2, Play, ExternalLink } from 'lucide-react';

const AgentCoordinator: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Core configuration card */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }} className="interactive-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Human-in-the-Loop Gate</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
          The cognitive planner parses instructions through the low-latency LLM pipeline. 
          Any destructive or external integration tool execution is paused until manual operator clearance (AD-005).
        </p>
        
        <div style={{
          backgroundColor: 'var(--bg-app)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <CheckCircle2 size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} aria-hidden="true" />
          <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>
            System Status: <strong>Ready</strong>. Tool registry synchronized with local plugins.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: 'var(--color-primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'opacity var(--transition-fast)'
          }}
          onClick={() => alert('Starting a new AI Executive Agent session...')}
          >
            <Play size={14} aria-hidden="true" />
            <span>Initialize Session</span>
          </button>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: 'transparent',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            transition: 'background-color var(--transition-fast)'
          }}
          onClick={() => alert('Loading local tool registries...')}
          >
            <span>View Tool Registry</span>
            <ExternalLink size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentCoordinator;
