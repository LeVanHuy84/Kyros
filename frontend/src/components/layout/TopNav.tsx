import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, History, PlayCircle, ClipboardCheck } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const TopNav: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const location = useLocation();

  // Determine Title and Description based on the current path
  const getPageMeta = () => {
    const path = location.pathname;
    if (path.startsWith('/agent')) {
      return {
        title: 'Cognitive Agent Orchestration',
        description: 'Manage autonomous execution sequences and tool approval checkpoints.'
      };
    }
    if (path.startsWith('/todo')) {
      return {
        title: 'Task Bounded Context',
        description: 'Track workspace assignments with safe soft-delete recovery bounds.'
      };
    }
    if (path.startsWith('/calendar')) {
      return {
        title: 'Schedule Bounded Context',
        description: 'Analyze timeline intervals to intercept scheduling collisions.'
      };
    }
    if (path.startsWith('/integrations')) {
      return {
        title: 'Connector Integrations Hub',
        description: 'Register and manage external system adapters and OAuth bindings.'
      };
    }
    if (path.startsWith('/settings')) {
      return {
        title: 'Settings Hub',
        description: 'Configure your preferences, notification rules, and memory vault.'
      };
    }
    if (path.startsWith('/admin')) {
      return {
        title: 'System Operator Console',
        description: 'Manage platform tenant workspaces, user accounts, and rate limit tiers.'
      };
    }
    return {
      title: 'AI Executive Assistant',
      description: 'Your intelligent coordinate platform.'
    };
  };

  const meta = getPageMeta();

  return (
    <header className="header-bar">
      <div className="header-title-section">
        <h2>{meta.title}</h2>
        <p>{meta.description}</p>
      </div>

      <div className="header-controls">
        {/* Workspace Display */}
        <div className="workspace-badge">
          <span>Workspace:</span>
          <code>{activeWorkspace?.id || 'no-active-workspace'}</code>
        </div>

        {/* Global Action Icons */}
        <div className="header-actions">
          {/* Pending Approvals Queue [Q] */}
          <button 
            className="action-btn" 
            title="Pending Approvals Queue [Q]"
            onClick={() => alert('Opening Pending Approvals Queue (Screen 27)')}
          >
            <ClipboardCheck size={18} />
            <span className="action-badge">3</span>
          </button>

          {/* Session History [L] */}
          <button 
            className="action-btn" 
            title="Session History [L]"
            onClick={() => alert('Opening Session History Directory (Screen 26)')}
          >
            <History size={18} />
          </button>

          {/* Active Session Tracker Toggle [P|] */}
          <button 
            className="action-btn" 
            title="Active Session Tracker [P|]"
            onClick={() => alert('Toggling Plan Execution Tracker Drawer (Screen 24)')}
          >
            <PlayCircle size={18} style={{ color: 'var(--color-secondary)' }} />
            <span className="action-badge" style={{ backgroundColor: 'var(--color-secondary)' }}>●</span>
          </button>

          {/* Notification Bell [Bell] */}
          <button 
            className="action-btn" 
            title="Notifications [Bell]"
            onClick={() => alert('Opening Notifications Dropdown Panel (Screen 18)')}
          >
            <Bell size={18} />
            <span className="action-badge">5</span>
          </button>
        </div>
      </div>
    </header>
  );
};
