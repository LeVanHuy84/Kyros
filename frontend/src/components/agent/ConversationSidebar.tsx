import React from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';

export interface ConversationItem {
  id: string;
  title: string;
  lastTurnTimestamp?: string;
  status: string;
}

interface ConversationSidebarProps {
  conversations: ConversationItem[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
}) => {
  return (
    <div
      style={{
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        height: '100%',
        overflowY: 'auto',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <MessageSquare size={13} />
        <span>Lịch sử hội thoại</span>
      </div>
      {conversations.map((c) => (
        <div
          key={c.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '6px',
            border: c.id === activeConversationId ? '1px solid var(--color-primary)' : '1px solid transparent',
            backgroundColor: c.id === activeConversationId ? 'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.1)' : 'transparent',
            paddingRight: '6px',
          }}
        >
          <button
            onClick={() => onSelectConversation(c.id)}
            style={{
              flex: 1,
              textAlign: 'left',
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text-main)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {c.title}
          </button>
          {onDeleteConversation && (
            <button
              title="Xóa cuộc trò chuyện"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConversation(c.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
