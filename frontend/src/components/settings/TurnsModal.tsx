import React from 'react';
import { X } from 'lucide-react';
import type { ConversationTurn } from '../../types/memory';

interface TurnsModalProps {
  title: string;
  turns: ConversationTurn[];
  onClose: () => void;
}

export const TurnsModal: React.FC<TurnsModalProps> = ({ title, turns, onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          width: '95%',
          maxWidth: '650px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Turns: "{title}"</h4>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body / Scrollable turn logs */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            backgroundColor: 'var(--bg-app)',
            flex: 1,
          }}
        >
          {turns.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
              No messages recorded in this thread history.
            </div>
          ) : (
            turns.map((turn) => (
              <div
                key={turn.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: turn.role === 'User' ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    backgroundColor: turn.role === 'User' ? 'var(--color-primary)' : 'var(--bg-card)',
                    color: turn.role === 'User' ? 'white' : 'var(--text-main)',
                    border: turn.role === 'User' ? 'none' : '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {turn.content}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                    textAlign: turn.role === 'User' ? 'right' : 'left',
                    padding: '0 4px',
                  }}
                >
                  {turn.role} • {new Date(turn.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'right',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Close Logs
          </button>
        </div>
      </div>
    </div>
  );
};
