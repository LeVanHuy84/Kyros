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
        marginBottom: '8px',
        paddingBottom: '6px',
        borderBottom: '1px dashed var(--border-color)',
      }}
    >
      {!isStreaming ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px 0',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            opacity: 0.85,
          }}
        >
          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span>
            🧠 Đã thực thi {stepCount} bước suy nghĩ & công cụ {isOpen ? '(Thu gọn)' : '(Xem chi tiết)'}
          </span>
        </button>
      ) : null}

      {showDetails && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: isStreaming ? '0' : '6px' }}>
          {thoughtSteps?.map((step, sIdx) => (
            <div key={sIdx} style={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={11} style={{ color: '#10b981' }} />
              <span>{step}</span>
            </div>
          ))}
          {activeThoughtStatus && (
            <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', color: '#6366f1' }}>
              <Sparkles size={12} className="animate-spin" />
              <span>{activeThoughtStatus}</span>
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
        height: '380px',
        backgroundColor: 'var(--bg-app)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
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
                : 'var(--bg-card)',
            color: m.sender === 'user' ? '#fff' : 'var(--text-main)',
            border:
              m.sender === 'user'
                ? 'none'
                : '1px solid var(--border-color)',
            padding: '12px 16px',
            borderRadius:
              m.sender === 'user'
                ? '16px 16px 4px 16px'
                : '16px 16px 16px 4px',
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
              <ReactMarkdown>{m.text || (m.isStreaming && !m.activeThoughtStatus ? '...' : '')}</ReactMarkdown>
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
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
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
