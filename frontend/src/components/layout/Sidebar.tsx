import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bot,
  ListTodo,
  Calendar,
  Settings,
  Link2,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { TenantSelector } from './TenantSelector';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const { user, logout } = useAuth();

  const isSystemOperator = user?.roles.includes('SYSTEM_OPERATOR') || false;

  const handleNavigate = () => onClose();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <img
            src="/favicon.svg"
            alt="Kyros Logo"
            style={{ width: '24px', height: '24px' }}
            aria-hidden="true"
          />
          <h1>Kyros</h1>
        </div>
        <p className="sidebar-sub">Tenant Workspace v2.0</p>
      </div>

      {/* Tenant Selector Dropdown */}
      <TenantSelector />

      <nav className="sidebar-nav" aria-label="Main Navigation">
        <NavLink to="/agent" className="nav-link" onClick={handleNavigate}>
          <Bot size={18} aria-hidden="true" />
          <span>Agent Coordinator</span>
        </NavLink>

        <NavLink to="/todo" className="nav-link" onClick={handleNavigate}>
          <ListTodo size={18} aria-hidden="true" />
          <span>Task Management</span>
        </NavLink>

        <NavLink to="/calendar" className="nav-link" onClick={handleNavigate}>
          <Calendar size={18} aria-hidden="true" />
          <span>Schedule Overlaps</span>
        </NavLink>

        <NavLink
          to="/integrations"
          className="nav-link"
          onClick={handleNavigate}
        >
          <Link2 size={18} aria-hidden="true" />
          <span>Integrations</span>
        </NavLink>

        <NavLink to="/settings" className="nav-link" onClick={handleNavigate}>
          <Settings size={18} aria-hidden="true" />
          <span>Settings</span>
        </NavLink>

        {isSystemOperator && (
          <>
            <div
              style={{
                height: '1px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                margin: '20px 0 10px 0',
              }}
            />
            <div className="sidebar-section-title">Admin Console</div>
            <NavLink
              to="/admin/users"
              className="nav-link"
              onClick={handleNavigate}
            >
              <ShieldAlert size={18} aria-hidden="true" />
              <span>User Admin</span>
            </NavLink>
            <NavLink
              to="/admin/workspaces"
              className="nav-link"
              onClick={handleNavigate}
            >
              <ShieldAlert size={18} aria-hidden="true" />
              <span>Workspace Admin</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="profile-card">
        <div className="profile-info">
          <span className="profile-name">{user?.name || 'Jane Doe'}</span>
          <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
            {user?.email || 'jane.doe@example.com'}
          </span>
        </div>
        <button
          onClick={() => {
            logout();
            onClose();
          }}
          className="logout-btn"
          aria-label="Log out"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};
