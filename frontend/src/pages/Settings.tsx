import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Brain,
  MessageSquare,
  BellRing,
  Briefcase,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { useConversations } from '../hooks/useConversations';
import { PreferencesPanel } from '../components/settings/PreferencesPanel';
import { MemoryVaultPanel } from '../components/settings/MemoryVaultPanel';
import { ConversationsDirectoryPanel } from '../components/settings/ConversationsDirectoryPanel';
import { TurnsModal } from '../components/settings/TurnsModal';
import type { ConversationTurn } from '../types/memory';

const Settings: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    'pref' | 'vault' | 'conv' | 'notif' | 'ws'
  >('pref');
  const { getConversationTurns } = useConversations();

  // Alert and success statuses
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loadingTurns, setLoadingTurns] = useState<boolean>(false);

  // Turns modal state
  const [selectedConvTurns, setSelectedConvTurns] = useState<
    ConversationTurn[]
  >([]);
  const [viewingConvTitle, setViewingConvTitle] = useState<string>('');
  const [showTurnsModal, setShowTurnsModal] = useState<boolean>(false);

  // Auto-dismiss success alert
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
  };

  const handleError = (msg: string) => {
    setErrorMsg(msg);
  };

  const handleOpenTurns = async (id: string, title: string) => {
    setLoadingTurns(true);
    try {
      const turns = await getConversationTurns(id);
      setSelectedConvTurns(turns);
      setViewingConvTitle(title);
      setShowTurnsModal(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load conversation turns.');
    } finally {
      setLoadingTurns(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Success alert toast */}
      {successMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            backgroundColor: '#10B981',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 9999,
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error alert box */}
      {errorMsg && (
        <div
          style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #F87171',
            color: '#991B1B',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#991B1B',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Loading turns overlay */}
      {loadingTurns && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
          }}
        >
          <Loader2
            className="animate-spin"
            size={32}
            style={{ color: 'var(--color-primary)' }}
          />
        </div>
      )}

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        {/* Settings Sub-Tabs navigation */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            padding: '0 16px',
          }}
        >
          {[
            {
              id: 'pref',
              label: 'Preferences',
              icon: <SettingsIcon size={16} />,
            },
            { id: 'vault', label: 'Memory Vault', icon: <Brain size={16} /> },
            {
              id: 'conv',
              label: 'Conversations',
              icon: <MessageSquare size={16} />,
            },
            {
              id: 'notif',
              label: 'Notifications',
              icon: <BellRing size={16} />,
            },
            {
              id: 'ws',
              label: 'Workspace Settings',
              icon: <Briefcase size={16} />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                setErrorMsg(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 24px',
                border: 'none',
                background: 'none',
                color:
                  activeSubTab === tab.id
                    ? 'var(--color-primary)'
                    : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: activeSubTab === tab.id ? '600' : '500',
                borderBottom:
                  activeSubTab === tab.id
                    ? '2px solid var(--color-primary)'
                    : '2px solid transparent',
                transition:
                  'color var(--transition-fast), border-color var(--transition-fast)',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings content body */}
        <div style={{ padding: '32px', minHeight: '300px' }}>
          {activeSubTab === 'pref' && (
            <PreferencesPanel onSuccess={handleSuccess} onError={handleError} />
          )}

          {activeSubTab === 'vault' && (
            <MemoryVaultPanel onSuccess={handleSuccess} onError={handleError} />
          )}

          {activeSubTab === 'conv' && (
            <ConversationsDirectoryPanel
              onSuccess={handleSuccess}
              onError={handleError}
              onViewTurns={handleOpenTurns}
            />
          )}

          {activeSubTab === 'notif' && (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Notification Settings
              </h4>
              <p
                style={{
                  fontSize: '15px',
                  color: 'var(--text-muted)',
                  margin: 0,
                  lineHeight: '1.6',
                }}
              >
                Configure real-time WebSocket reminders and email digests for
                high-priority task flags.
              </p>
            </div>
          )}

          {activeSubTab === 'ws' && (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Workspace Configurations
              </h4>
              <p
                style={{
                  fontSize: '15px',
                  color: 'var(--text-muted)',
                  margin: 0,
                  lineHeight: '1.6',
                }}
              >
                Update workspace labels or archive this context. Only workspace
                administrators are permitted to alter these records.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Turns Modal dialog */}
      {showTurnsModal && (
        <TurnsModal
          title={viewingConvTitle}
          turns={selectedConvTurns}
          onClose={() => setShowTurnsModal(false)}
        />
      )}
    </div>
  );
};

export default Settings;
