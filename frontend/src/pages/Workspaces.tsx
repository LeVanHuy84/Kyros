import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { Briefcase, ChevronRight, Plus } from 'lucide-react';

const Workspaces: React.FC = () => {
  const { workspaces, selectWorkspace, createWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const handleSelect = (id: string) => {
    selectWorkspace(id);
    navigate('/agent');
  };

  const handleCreate = async () => {
    const name = prompt('Enter name for the new workspace:');
    if (name && name.trim()) {
      const newWs = await createWorkspace(name.trim());
      handleSelect(newWs.id);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-app)',
      fontFamily: 'var(--font-sans)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-lg)',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>Select Workspace</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>Select tenant context to begin orchestrating</p>
          </div>
          <button 
            onClick={handleCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            <Plus size={14} />
            <span>New</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {workspaces.map(ws => (
            <button
              key={ws.id}
              onClick={() => handleSelect(ws.id)}
              disabled={ws.status === 'SUSPENDED'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                cursor: ws.status === 'SUSPENDED' ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                width: '100%',
                opacity: ws.status === 'SUSPENDED' ? 0.5 : 1,
                transition: 'border-color var(--transition-fast), background-color var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(79, 70, 229, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)'
                }}>
                  <Briefcase size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>{ws.name}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {ws.id}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: ws.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: ws.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-danger)'
                }}>
                  {ws.status}
                </span>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Workspaces;
