import React, { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  Play,
  ExternalLink,
  Bot,
  Send,
  Sparkles,
} from 'lucide-react';

export const AgentCoordinator: React.FC = () => {
  const [messages, setMessages] = useState<
    Array<{ sender: 'user' | 'agent'; text: string; time: string }>
  >([
    {
      sender: 'agent',
      text: 'Chào bạn! Tôi là Kyros AI Executive Assistant. Bạn muốn tôi hỗ trợ xếp lịch, quản lý task hay tổng hợp note hôm nay?',
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);
  const [inputTurn, setInputTurn] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTurn.trim()) return;

    const userText = inputTurn.trim();
    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: userText, time: now },
    ]);
    setInputTurn('');
    setIsThinking(true);

    setTimeout(() => {
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: `[Agent Preview Mode]: Tôi đã tiếp nhận yêu cầu "${userText}". Cổng Tool Calling Agentic AI sắp tới sẽ trực tiếp thực thi thao tác này trên hệ thống!`,
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Interactive Agent Chat Playground */}
      <div
        className="card"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor:
                  'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.15)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={22} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  margin: 0,
                }}
              >
                Kyros Agent Chat Drawer
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  margin: 0,
                }}
              >
                Trực quan hóa tương tác giữa Người dùng và Trợ lý AI
              </p>
            </div>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--color-success)',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} /> Agent Live Ready
          </span>
        </div>

        {/* Chat History Box */}
        <div
          style={{
            height: '340px',
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
                maxWidth: '80%',
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
                lineHeight: '1.5',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div>{m.text}</div>
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
              }}
            >
              🤖 Kyros AI đang suy nghĩ...
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={handleSendMessage}
          style={{ display: 'flex', gap: '10px' }}
        >
          <input
            type="text"
            placeholder="Nhập câu lệnh cho Agent (Ví dụ: 'Sắp xếp lịch học chiều nay')..."
            value={inputTurn}
            onChange={(e) => setInputTurn(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0 20px', gap: '8px' }}
          >
            <Send size={16} />
            <span>Gửi</span>
          </button>
        </form>
      </div>

      {/* Core configuration card */}
      <div className="card interactive-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield
            size={22}
            style={{ color: 'var(--color-primary)' }}
            aria-hidden="true"
          />
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
            Human-in-the-Loop Security Gate
          </h3>
        </div>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '15px',
            margin: 0,
            lineHeight: '1.6',
          }}
        >
          Mọi quyết định xóa hoặc ghi đè lịch quan trọng của Agent sẽ được đưa
          qua luồng Phê duyệt thủ công (Human Approval Queue) để đảm bảo an toàn
          tuyệt đối.
        </p>

        <div
          style={{
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <CheckCircle2
            size={20}
            style={{ color: 'var(--color-success)', flexShrink: 0 }}
            aria-hidden="true"
          />
          <span style={{ fontSize: '15px', color: 'var(--text-main)' }}>
            System Status:{' '}
            <strong style={{ color: 'var(--color-success)' }}>Ready</strong>.
            Tool registry synchronized with local plugins.
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            marginTop: '12px',
          }}
        >
          <button
            className="btn btn-primary"
            onClick={() =>
              alert('Starting a new AI Executive Agent session...')
            }
          >
            <Play size={15} aria-hidden="true" />
            <span>Initialize Session</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => alert('Loading local tool registries...')}
          >
            <span>View Tool Registry</span>
            <ExternalLink size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentCoordinator;
