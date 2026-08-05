import React from 'react';
import { Shield } from 'lucide-react';

const WorkspaceAdmin: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Shield size={22} style={{ color: 'var(--color-danger)' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Platform Workspace Directory</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: '0 0 12px 0', lineHeight: '1.6' }}>
          Global registry of tenant workspace segments. Operator is permitted to suspend operations, audit sizes, or configure custom rate limit profiles.
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
                <th style={{ padding: '16px 20px' }}>Workspace Context</th>
                <th style={{ padding: '16px 20px' }}>UUID</th>
                <th style={{ padding: '16px 20px' }}>Status</th>
                <th style={{ padding: '16px 20px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Jane's Workspace", uuid: 'workspace-demo-uuid', status: 'ACTIVE' },
                { name: 'Marketing Workspace', uuid: 'workspace-marketing-uuid', status: 'ACTIVE' },
                { name: 'Archived Workspace', uuid: 'workspace-suspended-uuid', status: 'SUSPENDED' }
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{row.name}</span>
                  </td>
                  <td style={{ padding: '16px 20px' }}><code>{row.uuid}</code></td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className={`badge ${row.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '12px' }}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button 
                      className={`btn ${row.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
                      style={{ padding: '8px 14px', fontSize: '13px' }}
                    >
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
