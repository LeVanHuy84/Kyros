import React from 'react';
import { Shield } from 'lucide-react';

const WorkspaceAdmin: React.FC = () => {
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
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Platform Workspace Directory</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 20px 0' }}>
          Global registry of tenant workspace segments. Operator is permitted to suspend operations, audit sizes, or configure custom rate limit profiles.
        </p>

        <div style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px' }}>Workspace Context</th>
                <th style={{ padding: '12px 16px' }}>UUID</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Jane's Workspace", uuid: 'workspace-demo-uuid', status: 'ACTIVE' },
                { name: 'Marketing Workspace', uuid: 'workspace-marketing-uuid', status: 'ACTIVE' },
                { name: 'Archived Workspace', uuid: 'workspace-suspended-uuid', status: 'SUSPENDED' }
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: '500' }}>{row.name}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}><code>{row.uuid}</code></td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: row.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-danger)'
                    }}>{row.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button style={{
                      background: 'none',
                      border: 'none',
                      color: row.status === 'ACTIVE' ? 'var(--color-danger)' : 'var(--color-success)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {row.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
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

export default WorkspaceAdmin;
