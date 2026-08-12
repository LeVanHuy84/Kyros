import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../hooks/useWorkspace';
import { useAuth } from '../hooks/useAuth';
import { Briefcase, ChevronRight, Plus } from 'lucide-react';

const Workspaces: React.FC = () => {
  const { workspaces, selectWorkspace, createWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

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
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        fontFamily: 'var(--font-sans)',
        padding: '20px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: '600',
                color: 'var(--text-main)',
                margin: 0,
              }}
            >
              Select Workspace
            </h2>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '15px',
                margin: '6px 0 0 0',
              }}
            >
              Select tenant context to begin orchestrating
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="btn btn-primary"
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            <Plus size={15} />
            <span>New</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => handleSelect(ws.id)}
              disabled={ws.status === 'SUSPENDED'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                cursor: ws.status === 'SUSPENDED' ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                width: '100%',
                opacity: ws.status === 'SUSPENDED' ? 0.5 : 1,
                transition:
                  'border-color var(--transition-fast), background-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (ws.status !== 'SUSPENDED') {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }
              }}
              onMouseLeave={(e) => {
                if (ws.status !== 'SUSPENDED') {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                  }}
                >
                  <Briefcase size={20} />
                </div>
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'var(--text-main)',
                    }}
                  >
                    {ws.name}
                  </h4>
                  <span
                    style={{ fontSize: '13px', color: 'var(--text-muted)' }}
                  >
                    ID: {ws.id}
                  </span>
                </div>
              </div>

              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span
                  className={`badge ${ws.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}
                  style={{ fontSize: '11px' }}
                >
                  {ws.status}
                </span>
                <ChevronRight
                  size={18}
                  style={{ color: 'var(--text-muted)' }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Workspaces;
