import React from 'react';
import { Shield } from 'lucide-react';

const UserAdmin: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Shield size={20} style={{ color: 'var(--color-danger)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>User Administration Dashboard</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 20px 0' }}>
          Platform operator administrative console to update roles, audit sign-in telemetry, unlock accounts, or edit registration parameters.
        </p>

        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px' }}>User</th>
                <th style={{ padding: '12px 16px' }}>Roles</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Operator Jane', email: 'operator@assistant.ai', roles: 'USER, SYSTEM_OPERATOR', status: 'Active' },
                { name: 'Jane Doe', email: 'jane.doe@example.com', roles: 'USER', status: 'Active' },
                { name: 'Suspended Account', email: 'spammer@domain.com', roles: 'USER', status: 'Locked' }
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '500' }}>{row.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.email}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}><code>{row.roles}</code></td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: row.status === 'Active' ? 'var(--color-success)' : 'var(--color-danger)'
                    }}>{row.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>Edit Roles</button>
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
