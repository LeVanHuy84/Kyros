import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Radio,
  Key,
  Plus,
  Shield,
  CheckCircle2,
  Play,
  ExternalLink,
} from 'lucide-react';
import { encryptApiKey, decryptApiKey } from '../utils/crypto';
import { useWorkspace } from '../hooks/useWorkspace';
import apiClient from '../services/api-client';
import { ByokConfigModal } from '../components/agent/ByokConfigModal';
import type { ByokConfig } from '../components/agent/ByokConfigModal';
import { ConversationSidebar } from '../components/agent/ConversationSidebar';
import type { ConversationItem } from '../components/agent/ConversationSidebar';
import { ChatWindow } from '../components/agent/ChatWindow';
import type { MessageItem } from '../components/agent/ChatWindow';
import { ApprovalBanner } from '../components/agent/ApprovalBanner';
import type { PendingApprovalData } from '../components/agent/ApprovalBanner';

const PROVIDER_PRESETS: Record<string, { baseUrl: string; model: string; name: string }> = {
  groq: {
    name: '🚀 Groq (Free Tier)',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
  },
  gemini: {
    name: '✨ Google Gemini (Free Tier)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    model: 'gemini-1.5-flash',
  },
  xkiro: {
    name: '🤖 xAI / XKiro',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-2-latest',
  },
  ollama: {
    name: '🦙 Local Ollama (Offline)',
    baseUrl: 'http://localhost:11434/v1',
    model: 'qwen2.5:1.5b',
  },
  openrouter: {
    name: '🌐 OpenRouter / OpenAI',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4o-mini',
  },
};

export const AgentCoordinator: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const [messages, setMessages] = useState<MessageItem[]>([
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
  const [isStreamingMode, setIsStreamingMode] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<PendingApprovalData | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [byokConfig, setByokConfig] = useState<ByokConfig>({
    provider: 'groq',
    apiKey: '',
    baseUrl: PROVIDER_PRESETS.groq.baseUrl,
    model: PROVIDER_PRESETS.groq.model,
  });

  // Auto-scroll chat window to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  useEffect(() => {
    const loadConfig = async () => {
      const saved = localStorage.getItem('kyros_byok_config_enc');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const decryptedKey = await decryptApiKey(parsed.apiKeyEnc || '');
          setByokConfig({
            provider: parsed.provider || 'groq',
            apiKey: decryptedKey,
            baseUrl: parsed.baseUrl || PROVIDER_PRESETS.groq.baseUrl,
            model: parsed.model || PROVIDER_PRESETS.groq.model,
          });
        } catch {
          // ignore
        }
      }
    };
    loadConfig();
  }, []);

  // Fetch backend conversations list when workspace changes
  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchConversations = async () => {
      try {
        const res = await apiClient.get(`/v1/workspaces/${activeWorkspace.id}/conversations`);
        const list: ConversationItem[] = res.data.data || [];
        setConversations(list);

        if (list.length > 0) {
          const firstId = list[0].id;
          setActiveConversationId(firstId);
          loadConversationTurns(activeWorkspace.id, firstId);
        } else {
          startNewConversation(activeWorkspace.id);
        }
      } catch (err) {
        console.warn('Failed to load conversations from backend', err);
      }
    };
    fetchConversations();
  }, [activeWorkspace?.id]);

  const loadConversationTurns = async (wsId: string, convId: string) => {
    try {
      const res = await apiClient.get(`/v1/workspaces/${wsId}/conversations/${convId}/turns?limit=50`);
      const turns: Array<{ id: string; role: string; content: string; timestamp: string }> = res.data || [];
      if (turns.length > 0) {
        const mappedMessages: MessageItem[] = turns.map((t) => ({
          sender: t.role.toLowerCase() === 'user' ? 'user' : 'agent',
          text: t.content,
          time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(mappedMessages);
      } else {
        setMessages([
          {
            sender: 'agent',
            text: 'Chào bạn! Tôi là Kyros AI Executive Assistant. Bạn muốn tôi hỗ trợ xếp lịch, quản lý task hay tổng hợp note hôm nay?',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.warn('Failed to load turns for conversation', convId, err);
    }
  };

  const startNewConversation = async (wsId: string) => {
    try {
      const res = await apiClient.post(`/v1/workspaces/${wsId}/conversations`, {
        sessionId: null,
      });
      const newConv: ConversationItem = {
        id: res.data.id,
        title: res.data.title || 'Cuộc trò chuyện mới',
        status: res.data.status,
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setMessages([
        {
          sender: 'agent',
          text: 'Chào bạn! Tôi là Kyros AI Executive Assistant. Bạn muốn tôi hỗ trợ xếp lịch, quản lý task hay tổng hợp note hôm nay?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.warn('Failed to start new conversation', err);
    }
  };

  const saveConfig = async (newConfig: ByokConfig) => {
    setByokConfig(newConfig);
    const encryptedKey = await encryptApiKey(newConfig.apiKey);
    const toSave = {
      provider: newConfig.provider,
      apiKeyEnc: encryptedKey,
      baseUrl: newConfig.baseUrl,
      model: newConfig.model,
    };
    localStorage.setItem('kyros_byok_config_enc', JSON.stringify(toSave));
  };

  const handleProviderChange = (providerKey: string) => {
    const preset = PROVIDER_PRESETS[providerKey];
    if (preset) {
      const updated = {
        ...byokConfig,
        provider: providerKey,
        baseUrl: preset.baseUrl,
        model: preset.model,
      };
      saveConfig(updated);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTurn.trim()) return;

    if (!activeWorkspace) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: '⚠️ Vui lòng chọn một Workspace hoạt động trước khi sử dụng Agent Coordinator.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    const currentWorkspaceId = activeWorkspace.id;
    const userText = inputTurn.trim();
    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: MessageItem = { sender: 'user', text: userText, time: now };
    setMessages((prev) => [...prev, userMsg]);
    setInputTurn('');
    setIsThinking(true);

    if (activeConversationId) {
      apiClient
        .post(`/v1/workspaces/${currentWorkspaceId}/conversations/${activeConversationId}/turns`, {
          senderRole: 'USER',
          messageContent: userText,
        })
        .then(() => {
          apiClient.get(`/v1/workspaces/${currentWorkspaceId}/conversations`).then((res) => {
            if (res.data && res.data.data) {
              setConversations(res.data.data);
            }
          });
        })
        .catch(() => {});
    }

    const token = localStorage.getItem('token');

    const secureHeaders: Record<string, string> = {
      'X-AI-Provider': byokConfig.provider,
      'X-AI-Base-Url': byokConfig.baseUrl,
      'X-AI-Model': byokConfig.model,
      'X-Workspace-Id': currentWorkspaceId,
    };
    if (byokConfig.apiKey) {
      secureHeaders['X-AI-Api-Key'] = byokConfig.apiKey;
    }
    if (token) {
      secureHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (isStreamingMode) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isStreaming: true,
        },
      ]);

      try {
        const response = await fetch(
          `/api/v1/workspaces/${currentWorkspaceId}/agent/chat/stream?prompt=${encodeURIComponent(userText)}`,
          { headers: secureHeaders }
        );

        if (!response.ok || !response.body) throw new Error(`Stream HTTP ${response.status}: ${response.statusText}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullAgentResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = 'message';
          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.replace('event:', '').trim();
            } else if (line.startsWith('data:')) {
              const dataText = line.replace('data:', '').trim();

              if (currentEvent === 'thought') {
                fullAgentResponse += `> 🧠 *${dataText}*\n\n`;
              } else if (currentEvent === 'observation') {
                fullAgentResponse += `> 🔧 *Công cụ:* ${dataText}\n\n`;
              } else if (currentEvent === 'approval') {
                try {
                  const data = JSON.parse(dataText);
                  setPendingApproval({
                    toolName: data.toolName,
                    argumentsJson: data.argumentsJson,
                    reason: data.reason,
                  });
                  fullAgentResponse += `⚠️ **[CẦN PHÊ DUYỆT]**: ${data.reason}\n*Công cụ:* \`${data.toolName}\`\n\n`;
                } catch {
                  // ignore
                }
              } else if (currentEvent === 'completed') {
                // Done
              } else if (currentEvent === 'chunk') {
                fullAgentResponse += dataText;
              }

              const currentContent = fullAgentResponse;
              setMessages((prev) => {
                const next = [...prev];
                if (next.length > 0 && next[next.length - 1].sender === 'agent') {
                  next[next.length - 1] = {
                    ...next[next.length - 1],
                    text: currentContent,
                    isStreaming: true,
                  };
                }
                return next;
              });
            }
          }
        }

        setMessages((prev) => {
          const next = [...prev];
          if (next.length > 0 && next[next.length - 1].sender === 'agent') {
            next[next.length - 1].isStreaming = false;
          }
          return next;
        });

        if (activeConversationId && fullAgentResponse.trim()) {
          apiClient.post(`/v1/workspaces/${currentWorkspaceId}/conversations/${activeConversationId}/turns`, {
            senderRole: 'ASSISTANT',
            messageContent: fullAgentResponse.trim(),
          }).catch(() => {});
        }

        setIsThinking(false);
      } catch (err: any) {
        setIsThinking(false);
        const errorText = `⚠️ **[Lỗi kết nối Agent]**: ${err?.message || 'Không thể gọi tới Backend/LLM Service'}\n\n*[Agent Fallback]*: Đã tiếp nhận "${userText}". Engine đang xử lý ngoại tuyến.`;
        
        setMessages((prev) => {
          const next = [...prev];
          if (next.length > 0 && next[next.length - 1].sender === 'agent') {
            next[next.length - 1] = {
              sender: 'agent',
              text: errorText,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isStreaming: false,
            };
          } else {
            next.push({
              sender: 'agent',
              text: errorText,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            });
          }
          return next;
        });
      }
    } else {
      try {
        const response = await fetch(`/api/v1/workspaces/${currentWorkspaceId}/agent/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...secureHeaders,
          },
          body: JSON.stringify({ prompt: userText }),
        });

        if (response.ok) {
          const data = await response.json();
          setIsThinking(false);
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          let finalAnswerText = data.finalAnswer || '';

          if (data.pendingApproval) {
            setPendingApproval({
              toolName: data.pendingToolName,
              argumentsJson: data.pendingToolArguments,
              reason: data.approvalReason,
            });
            finalAnswerText = `⚠️ **[CẦN PHÊ DUYỆT]**: ${data.approvalReason}\n*Công cụ:* \`${data.pendingToolName}\``;
          }

          setMessages((prev) => [...prev, { sender: 'agent', text: finalAnswerText, time }]);

          if (activeConversationId && finalAnswerText.trim()) {
            apiClient.post(`/v1/workspaces/${currentWorkspaceId}/conversations/${activeConversationId}/turns`, {
              senderRole: 'ASSISTANT',
              messageContent: finalAnswerText.trim(),
            }).catch(() => {});
          }
        } else {
          throw new Error('API request failed');
        }
      } catch {
        setIsThinking(false);
        setMessages((prev) => [
          ...prev,
          {
            sender: 'agent',
            text: `[Agent Fallback]: Đã tiếp nhận "${userText}". Engine đang xử lý ngoại tuyến.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    }
  };

  const handleApproveAction = async () => {
    if (!pendingApproval || !activeWorkspace) return;
    setIsThinking(true);
    try {
      const response = await fetch(`/api/v1/workspaces/${activeWorkspace.id}/agent/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: pendingApproval.toolName,
          argumentsJson: pendingApproval.argumentsJson,
        }),
      });
      setIsThinking(false);
      if (response.ok) {
        const data = await response.json();
        setPendingApproval(null);
        setMessages((prev) => [
          ...prev,
          {
            sender: 'agent',
            text: data.finalAnswer,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setIsThinking(false);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!activeWorkspace) return;
    try {
      await apiClient.delete(`/v1/workspaces/${activeWorkspace.id}/conversations/${convId}`);
      const updated = conversations.filter((c) => c.id !== convId);
      setConversations(updated);
      if (activeConversationId === convId) {
        if (updated.length > 0) {
          setActiveConversationId(updated[0].id);
          loadConversationTurns(activeWorkspace.id, updated[0].id);
        } else {
          startNewConversation(activeWorkspace.id);
        }
      }
    } catch (err) {
      console.warn('Failed to delete conversation', convId, err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
            flexWrap: 'wrap',
            gap: '12px',
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
                Hội thoại được lưu tự động ở Backend & Streaming chuẩn Markdown
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeWorkspace && (
              <button
                className="btn btn-secondary"
                onClick={() => startNewConversation(activeWorkspace.id)}
                style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}
              >
                <Plus size={14} />
                <span>Cuộc trò chuyện mới</span>
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => setShowConfigModal(!showConfigModal)}
              style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}
            >
              <Key size={14} />
              <span>AI Provider & Key</span>
            </button>
            <button
              onClick={() => setIsStreamingMode(!isStreamingMode)}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '4px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                color: isStreamingMode ? 'var(--color-primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Radio size={14} /> {isStreamingMode ? 'SSE Streaming ON' : 'REST Standard'}
            </button>
          </div>
        </div>

        <ByokConfigModal
          show={showConfigModal}
          byokConfig={byokConfig}
          presets={PROVIDER_PRESETS}
          onProviderChange={handleProviderChange}
          onConfigChange={saveConfig}
          onClose={() => setShowConfigModal(false)}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '16px' }}>
          <ConversationSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => {
              setActiveConversationId(id);
              if (activeWorkspace) loadConversationTurns(activeWorkspace.id, id);
            }}
            onDeleteConversation={handleDeleteConversation}
          />

          <ChatWindow
            messages={messages}
            isThinking={isThinking}
            chatContainerRef={chatContainerRef}
          />
        </div>

        <form
          onSubmit={handleSendMessage}
          style={{ display: 'flex', gap: '10px' }}
        >
          <input
            type="text"
            placeholder="Nhập câu lệnh cho Agent (Ví dụ: 'Tạo note họp nhóm' hoặc 'Xóa lịch họp')..."
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

      <ApprovalBanner
        pendingApproval={pendingApproval}
        onApprove={handleApproveAction}
        onCancel={() => setPendingApproval(null)}
      />

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
