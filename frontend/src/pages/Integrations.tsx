import React from 'react';
import { Link2 } from 'lucide-react';

const Integrations: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div className="card interactive-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link2 size={22} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Connector Integrations</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: 0, lineHeight: '1.6' }}>
          Connect Kyros with external email services, task trackers, calendar feeds, and team hubs to authorize the coordinator to act on your behalf.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '8px' }}>
          {[
            { name: 'Google Workspace', desc: 'Sync Calendar & Gmail context models.', status: 'Connected', connected: true },
            { name: 'Microsoft 365 Outlook', desc: 'Sync corporate email and events.', status: 'Available', connected: false },
            { name: 'Slack Bounded Bot', desc: 'Deliver notification reminders to target channels.', status: 'Available', connected: false }
          ].map((conn, idx) => (
            <div key={idx} style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: 'var(--bg-app)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform var(--transition-normal), border-color var(--transition-fast), box-shadow var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>{conn.name}</h4>
                <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{conn.desc}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <span className={`badge ${conn.connected ? 'badge-success' : 'badge-muted'}`} style={{ fontSize: '12px' }}>
                  {conn.status}
                </span>
                <button 
                  className={`btn ${conn.connected ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ padding: '8px 14px', fontSize: '13px' }}
                >
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
