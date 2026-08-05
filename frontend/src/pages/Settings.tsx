import React, { useState } from 'react';
import { Settings as SettingsIcon, Brain, MessageSquare, BellRing, Briefcase } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'pref' | 'vault' | 'conv' | 'notif' | 'ws'>('pref');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        {/* Settings Sub-Tabs navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-app)',
          padding: '0 12px'
        }}>
          {[
            { id: 'pref', label: 'Preferences', icon: <SettingsIcon size={14} /> },
            { id: 'vault', label: 'Memory Vault', icon: <Brain size={14} /> },
            { id: 'conv', label: 'Conversations', icon: <MessageSquare size={14} /> },
            { id: 'notif', label: 'Notifications', icon: <BellRing size={14} /> },
            { id: 'ws', label: 'Workspace Settings', icon: <Briefcase size={14} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 20px',
                border: 'none',
                background: 'none',
                color: activeSubTab === tab.id ? 'var(--color-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeSubTab === tab.id ? '600' : '500',
                borderBottom: activeSubTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                transition: 'color var(--transition-fast), border-color var(--transition-fast)'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings content body */}
        <div style={{ padding: '24px', minHeight: '300px' }}>
          {activeSubTab === 'pref' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>User Preferences</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Adjust interface parameters, toggle dark/light theme, or select default coordinator triggers.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <input type="checkbox" id="dark-theme" defaultChecked style={{ cursor: 'pointer' }} />
                <label htmlFor="dark-theme" style={{ fontSize: '13px', cursor: 'pointer' }}>Follow system theme preferences</label>
              </div>
            </div>
          )}

          {activeSubTab === 'vault' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Memory Vault</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Semantic memory context extracted from your completed sessions. Use this to review what the AI coordinator knows about your preferences.
              </p>
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                fontSize: '12px'
              }}>
                <code>
                  [No semantic entries registered in this tenant workspace yet.]
                </code>
              </div>
            </div>
          )}

          {activeSubTab === 'conv' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Conversations Directory</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Archive of past conversation threads and commands parsed by the LLM planner.
              </p>
            </div>
          )}

          {activeSubTab === 'notif' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Notification Settings</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Configure real-time WebSocket reminders and email digests for high-priority task flags.
              </p>
            </div>
          )}

          {activeSubTab === 'ws' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Workspace Configurations</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Update workspace labels or archive this context. Only workspace administrators are permitted to alter these records.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
