import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, RefreshCw, Building2 } from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useTheme } from '../../hooks/useTheme';
import { NotificationsDropdown } from './NotificationsDropdown';

interface TopNavProps {
  onToggleSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleSidebar }) => {
  const { activeWorkspace } = useWorkspace();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'reconnecting' | 'disconnected'
  >(navigator.onLine ? 'connected' : 'disconnected');

  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('reconnecting');
      setTimeout(() => setConnectionStatus('connected'), 1200);
    };
    const handleOffline = () => setConnectionStatus('disconnected');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetryConnection = () => {
    setConnectionStatus('reconnecting');
    setTimeout(() => {
      setConnectionStatus(navigator.onLine ? 'connected' : 'disconnected');
    }, 1000);
  };

  const handleThemeToggle = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      const isSystemDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      setTheme(isSystemDark ? 'light' : 'dark');
    }
  };

  const isDarkActive =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Determine Title and Description based on the current path
  const getPageMeta = () => {
    const path = location.pathname;
    if (path.startsWith('/agent')) {
      return {
        title: 'Cognitive Agent Orchestration',
        description:
          'Manage autonomous execution sequences and tool approval checkpoints.',
      };
    }
    if (path.startsWith('/todo')) {
      return {
        title: 'Task Bounded Context',
        description:
          'Track workspace assignments with safe soft-delete recovery bounds.',
      };
    }
    if (path.startsWith('/calendar')) {
      return {
        title: 'Schedule Bounded Context',
        description:
          'Analyze timeline intervals to intercept scheduling collisions.',
      };
    }

    if (path.startsWith('/settings')) {
      return {
        title: 'Settings Hub',
        description:
          'Configure your preferences, notification rules, and memory vault.',
      };
    }
    if (path.startsWith('/admin')) {
      return {
        title: 'System Operator Console',
        description:
          'Manage platform tenant workspaces, user accounts, and rate limit tiers.',
      };
    }
    return {
      title: 'AI Executive Assistant',
      description: 'Your intelligent coordinate platform.',
    };
  };

  const meta = getPageMeta();

  return (
    <header className="header-bar">
      <button
        className="hamburger-btn"
        onClick={onToggleSidebar}
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      <div className="header-title-section">
        <h2>{meta.title}</h2>
        <p>{meta.description}</p>
      </div>

      <div className="header-controls">
        {/* Realtime Connection Status Pill */}
        <div
          onClick={
            connectionStatus === 'disconnected'
              ? handleRetryConnection
              : undefined
          }
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: connectionStatus === 'disconnected' ? 'pointer' : 'default',
            backgroundColor:
              connectionStatus === 'connected'
                ? 'rgba(16, 185, 129, 0.1)'
                : connectionStatus === 'reconnecting'
                  ? 'rgba(245, 158, 11, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
            border:
              connectionStatus === 'connected'
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : connectionStatus === 'reconnecting'
                  ? '1px solid rgba(245, 158, 11, 0.3)'
                  : '1px solid rgba(239, 68, 68, 0.3)',
            color:
              connectionStatus === 'connected'
                ? '#10b981'
                : connectionStatus === 'reconnecting'
                  ? '#f59e0b'
                  : '#ef4444',
          }}
          title={
            connectionStatus === 'connected'
              ? 'Realtime SSE Active & Synchronized'
              : connectionStatus === 'reconnecting'
                ? 'Đang kết nối lại SSE...'
                : 'Mất kết nối realtime. Bấm để thử lại.'
          }
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor:
                connectionStatus === 'connected'
                  ? '#10b981'
                  : connectionStatus === 'reconnecting'
                    ? '#f59e0b'
                    : '#ef4444',
              animation:
                connectionStatus === 'reconnecting'
                  ? 'pulse 1.5s infinite'
                  : 'none',
            }}
          />
          <span className="hide-mobile">
            {connectionStatus === 'connected'
              ? 'Live SSE'
              : connectionStatus === 'reconnecting'
                ? 'Reconnecting'
                : 'Offline'}
          </span>
          {connectionStatus === 'disconnected' && <RefreshCw size={11} />}
        </div>

        {/* Workspace Display */}
        <div
          className="workspace-badge"
          title={`Workspace ID: ${activeWorkspace?.id || 'none'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Building2 size={13} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            {activeWorkspace?.name || 'Chưa chọn Workspace'}
          </span>
        </div>

        {/* Global Action Icons */}
        <div className="header-actions">
          {/* Theme Toggle Switch */}
          <button
            className="action-btn"
            title={`Toggle Theme (Current: ${theme})`}
            onClick={handleThemeToggle}
            aria-label="Toggle Theme"
          >
            {isDarkActive ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notification Bell [Bell] */}
          <NotificationsDropdown />
        </div>
      </div>
    </header>
  );
};
