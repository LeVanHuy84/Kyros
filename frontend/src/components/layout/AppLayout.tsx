import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { activeWorkspace, isLoading: wsLoading } = useWorkspace();

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-main)',
        fontFamily: 'var(--font-sans)'
      }}>
        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading authentication...</span>
      </div>
    );
  }

  // Security Check: Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (wsLoading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-main)',
        fontFamily: 'var(--font-sans)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--color-primary)',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading Workspace...</span>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Workspace Check: Redirect to workspace selector if no active workspace
  if (!activeWorkspace) {
    return <Navigate to="/workspaces" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <TopNav />
        <main className="content-body fade-in-slide-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
