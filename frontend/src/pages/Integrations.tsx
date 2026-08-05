import React from 'react';
import { Link2 } from 'lucide-react';

const Integrations: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
          <Link2 size={20} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Connector Integrations</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
          Connect Kyros with external email services, task trackers, calendar feeds, and team hubs to authorize the coordinator to act on your behalf.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '8px' }}>
          {[
            { name: 'Google Workspace', desc: 'Sync Calendar & Gmail context models.', status: 'Connected', connected: true },
            { name: 'Microsoft 365 Outlook', desc: 'Sync corporate email and events.', status: 'Available', connected: false },
            { name: 'Slack Bounded Bot', desc: 'Deliver notification reminders to target channels.', status: 'Available', connected: false }
          ].map((conn, idx) => (
            <div key={idx} style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: 'var(--bg-app)'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{conn.name}</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{conn.desc}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: conn.connected ? 'var(--color-success)' : 'var(--text-muted)'
                }}>
                  ● {conn.status}
                </span>
                <button style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: conn.connected ? '1px solid var(--border-color)' : 'none',
                  backgroundColor: conn.connected ? 'transparent' : 'var(--color-primary)',
                  color: conn.connected ? 'var(--text-main)' : '#ffffff',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  {conn.connected ? 'Configure' : 'Connect'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Integrations;
