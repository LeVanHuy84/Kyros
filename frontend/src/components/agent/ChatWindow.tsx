import React from 'react';
import type { RefObject } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles } from 'lucide-react';

export interface MessageItem {
  sender: 'user' | 'agent';
  text: string;
  time: string;
  isStreaming?: boolean;
}

interface ChatWindowProps {
  messages: MessageItem[];
  isThinking: boolean;
  chatContainerRef: RefObject<HTMLDivElement | null>;
}

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
          {m.sender === 'agent' ? (
            <div className="markdown-body">
              <ReactMarkdown>{m.text || (m.isStreaming ? '...' : '')}</ReactMarkdown>
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
          <span>🤖 Kyros AI đang suy nghĩ & soạn phản hồi...</span>
        </div>
      )}
    </div>
  );
};
