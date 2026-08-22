import React, { useEffect } from 'react';
import { Loader2, Trash2, Eye } from 'lucide-react';
import { useConversations } from '../../hooks/useConversations';

interface ConversationsDirectoryPanelProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onViewTurns: (id: string, title: string) => void;
}

export const ConversationsDirectoryPanel: React.FC<
  ConversationsDirectoryPanelProps
> = ({ onSuccess, onError, onViewTurns }) => {
  const {
    conversations,
    page,
    setPage,
    totalPages,
    isLoading,
    isSaving,
    error,
    clearConversation,
  } = useConversations();

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  const handleClear = async (id: string) => {
    if (
      window.confirm('Clear all chat messages in this conversation thread?')
    ) {
      const success = await clearConversation(id);
      if (success) {
        onSuccess('Conversation history cleared.');
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative',
      }}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <Loader2
            className="animate-spin"
            size={24}
            style={{ color: 'var(--color-primary)' }}
          />
        </div>
      )}

      <div>
        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Conversations Directory
        </h4>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--text-muted)',
            margin: '4px 0 0 0',
            lineHeight: '1.6',
          }}
        >
          Archive of past conversation threads and commands parsed by the LLM
          planner. Clear logs to clean agent context.
        </p>
      </div>

      {/* Conversations List */}
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '15px',
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--bg-app)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
              }}
            >
              <th style={{ padding: '16px 20px', fontWeight: '600' }}>
                Chat Thread Title
              </th>
              <th
                style={{
                  padding: '16px 20px',
                  fontWeight: '600',
                  width: '120px',
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: '16px 20px',
                  fontWeight: '600',
                  width: '220px',
                }}
              >
                Last Active
              </th>
              <th
                style={{
                  padding: '16px 20px',
                  fontWeight: '600',
                  width: '240px',
                  textAlign: 'right',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {conversations.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '32px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  No conversations registered in this workspace yet.
                </td>
              </tr>
            ) : (
              conversations.map((conv) => (
                <tr
                  key={conv.id}
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <td style={{ padding: '16px 20px', fontWeight: '500' }}>
                    "{conv.title}"
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor:
                          conv.status === 'Active'
                            ? '#E1F5FE'
                            : conv.status === 'Cleared'
                              ? '#ECEFF1'
                              : '#FBE9E7',
                        color:
                          conv.status === 'Active'
                            ? '#0288D1'
                            : conv.status === 'Cleared'
                              ? '#546E7A'
                              : '#D84315',
                      }}
                    >
                      {conv.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '16px 20px',
                      color: 'var(--text-muted)',
                      fontSize: '14px',
                    }}
                  >
                    {conv.lastTurnTimestamp
                      ? new Date(conv.lastTurnTimestamp).toLocaleString()
                      : 'N/A'}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '8px',
                      }}
                    >
                      <button
                        onClick={() => onViewTurns(conv.id, conv.title)}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-main)',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Eye size={14} />
                        <span>View Turns</span>
                      </button>
                      <button
                        onClick={() => handleClear(conv.id)}
                        disabled={conv.status === 'Cleared' || isSaving}
                        style={{
                          background: 'none',
                          border: '1px solid #F87171',
                          color: '#EF4444',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor:
                            conv.status === 'Cleared' ? 'default' : 'pointer',
                          opacity: conv.status === 'Cleared' ? 0.4 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Clear</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '12px',
          }}
        >
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              cursor: page === 0 ? 'default' : 'pointer',
              opacity: page === 0 ? 0.5 : 1,
              borderRadius: '4px',
            }}
          >
            Previous
          </button>
          <span
            style={{
              alignSelf: 'center',
              fontSize: '14px',
              color: 'var(--text-muted)',
            }}
          >
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              cursor: page >= totalPages - 1 ? 'default' : 'pointer',
              opacity: page >= totalPages - 1 ? 0.5 : 1,
              borderRadius: '4px',
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
