import React, { useState } from 'react';
import type { RefObject } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, ChevronDown, ChevronRight, Check } from 'lucide-react';

export interface MessageItem {
  sender: 'user' | 'agent';
  text: string;
  time: string;
  isStreaming?: boolean;
  activeThoughtStatus?: string;
  thoughtSteps?: string[];
}

interface ChatWindowProps {
  messages: MessageItem[];
  isThinking: boolean;
  chatContainerRef: RefObject<HTMLDivElement | null>;
}

const getToolBadge = (stepText: string) => {
  const lower = stepText.toLowerCase();
  if (lower.includes('calendar') || lower.includes('lịch') || lower.includes('event')) {
    return (
      <span className="tool-badge tool-badge-calendar">
        📅 Calendar Tool
      </span>
    );
  }
  if (lower.includes('task') || lower.includes('todo') || lower.includes('công việc')) {
    return (
      <span className="tool-badge tool-badge-task">
        ✅ Task Tool
      </span>
    );
  }
  if (lower.includes('memory') || lower.includes('note') || lower.includes('ghi chú') || lower.includes('semantic')) {
    return (
      <span className="tool-badge tool-badge-memory">
        🧠 Memory Tool
      </span>
    );
  }
  if (lower.startsWith('🔧') || lower.includes('tool:')) {
    return (
      <span className="tool-badge tool-badge-generic">
        ⚡ Agent Tool
      </span>
    );
  }
  return null;
};

const AgentThoughtAccordion: React.FC<{
  activeThoughtStatus?: string;
  thoughtSteps?: string[];
  isStreaming?: boolean;
}> = ({ activeThoughtStatus, thoughtSteps, isStreaming }) => {
  const [isOpen, setIsOpen] = useState(false);

  const stepCount = (thoughtSteps?.length || 0) + (activeThoughtStatus ? 1 : 0);
  if (stepCount === 0) return null;

  // While streaming, keep open by default. When finished streaming, auto-collapse.
  const showDetails = isStreaming || isOpen;

  return (
    <div
      style={{
        fontSize: '12px',
        color: 'var(--text-muted)',
        marginBottom: '10px',
        padding: '8px 12px',
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        borderRadius: '8px',
        border: '1px dashed rgba(99, 102, 241, 0.25)',
      }}
    >
      {!isStreaming ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary, #6366f1)',
            cursor: 'pointer',
            padding: '2px 0',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            width: '100%',
          }}
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>
            🧠 Quá trình suy luận & công cụ ({stepCount} bước){' '}
            <span style={{ fontSize: '11px', fontWeight: 400, opacity: 0.8 }}>
              {isOpen ? '(Thu gọn)' : '(Xem chi tiết)'}
            </span>
          </span>
        </button>
      ) : null}

      {showDetails && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginTop: isStreaming ? '0' : '8px',
          }}
        >
          {thoughtSteps?.map((step, sIdx) => {
            const badge = getToolBadge(step);
            return (
              <div
                key={sIdx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: 'var(--text-main)',
                }}
              >
                <Check size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{step}</span>
                {badge}
              </div>
            );
          })}
          {activeThoughtStatus && (
            <div
              style={{
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-primary, #6366f1)',
                fontSize: '12px',
              }}
            >
              <Sparkles size={13} className="animate-spin" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{activeThoughtStatus}</span>
              {getToolBadge(activeThoughtStatus)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isThinking,
  chatContainerRef,
}) => {
  return (
    <div
      ref={chatContainerRef}
      style={{
        flex: 1,
        height: '100%',
        minHeight: 0,
        padding: '16px 20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {messages.map((m, idx) => (
        <div
          key={idx}
          style={{
            alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            backgroundColor:
              m.sender === 'user'
                ? 'var(--color-primary)'
                : 'var(--bg-ai-bubble, var(--bg-card))',
            color: m.sender === 'user' ? '#fff' : 'var(--text-main)',
            border:
              m.sender === 'user'
                ? 'none'
                : '1px solid var(--border-ai-bubble, var(--border-color))',
            padding: '12px 16px',
            borderRadius:
              m.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            fontSize: '14px',
            lineHeight: '1.6',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {m.sender === 'agent' && (
            <AgentThoughtAccordion
              activeThoughtStatus={m.activeThoughtStatus}
              thoughtSteps={m.thoughtSteps}
              isStreaming={m.isStreaming}
            />
          )}

          {m.sender === 'agent' ? (
            <div className="markdown-body">
              <ReactMarkdown>
                {m.text ||
                  (m.isStreaming && !m.activeThoughtStatus ? '...' : '')}
              </ReactMarkdown>
              {m.isStreaming && <span className="streaming-cursor" title="Đang phản hồi..." />}
            </div>
          ) : (
            <div>{m.text}</div>
          )}
          <div
            style={{
              fontSize: '10px',
              opacity: 0.7,
              marginTop: '4px',
              textAlign: 'right',
            }}
          >
            {m.time}
          </div>
        </div>
      ))}

      {isThinking && (
        <div
          style={{
            alignSelf: 'flex-start',
            backgroundColor: 'var(--bg-ai-bubble, var(--bg-card))',
            border: '1px solid var(--border-ai-bubble, var(--border-color))',
            padding: '10px 16px',
            borderRadius: '16px 16px 16px 4px',
            fontSize: '13px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Sparkles size={14} className="animate-spin" />
          <span>🤖 Kyros AI đang suy nghĩ...</span>
        </div>
      )}
    </div>
  );
};
