import React from 'react';
import { Shield } from 'lucide-react';

const UserAdmin: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Shield size={22} style={{ color: 'var(--color-danger)' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>User Administration Dashboard</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: '0 0 12px 0', lineHeight: '1.6' }}>
          Platform operator administrative console to update roles, audit sign-in telemetry, unlock accounts, or edit registration parameters.
        </p>

        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: '600' }}>
                <th style={{ padding: '16px 20px' }}>User</th>
                <th style={{ padding: '16px 20px' }}>Roles</th>
                <th style={{ padding: '16px 20px' }}>Status</th>
                <th style={{ padding: '16px 20px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Operator Jane', email: 'operator@assistant.ai', roles: 'USER, SYSTEM_OPERATOR', status: 'Active' },
                { name: 'Jane Doe', email: 'jane.doe@example.com', roles: 'USER', status: 'Active' },
                { name: 'Suspended Account', email: 'spammer@domain.com', roles: 'USER', status: 'Locked' }
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{row.name}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{row.email}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}><code>{row.roles}</code></td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className={`badge ${row.status === 'Active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '12px' }}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button 
                      className="btn btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '13px' }}
                    >
                      Edit Roles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserAdmin;
