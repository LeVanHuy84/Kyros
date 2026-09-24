import { useState, useEffect, useRef } from 'react';
import { useWorkspace } from './useWorkspace';
import apiClient from '../services/api-client';
import type { ConversationItem } from '../components/agent/ConversationSidebar';
import type { MessageItem } from '../components/agent/ChatWindow';
import type { PendingApprovalData } from '../components/agent/ApprovalBanner';
import type { Note } from './useNotes';

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  const clean = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

export const useAgentChat = () => {
  const { activeWorkspace } = useWorkspace();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);
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
  const [pendingApproval, setPendingApproval] =
    useState<PendingApprovalData | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Fetch backend conversations list when workspace changes
  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchConversations = async () => {
      try {
        const res = await apiClient.get(
          `/v1/workspaces/${activeWorkspace.id}/conversations`
        );
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
  }, [activeWorkspace]);

  const loadConversationTurns = async (wsId: string, convId: string) => {
    try {
      const res = await apiClient.get(
        `/v1/workspaces/${wsId}/conversations/${convId}/turns?limit=50`
      );
      let turns: Array<{
        id?: string;
        role?: string;
        sender?: string;
        content?: string;
        text?: string;
        timestamp?: string;
      }> = res.data || [];

      if (turns.length === 0) {
        // Fallback to agent history if memory module turns list is empty
        try {
          const historyRes = await apiClient.get(
            `/v1/workspaces/${wsId}/agent/history?conversationId=${convId}`
          );
          if (
            historyRes.data &&
            Array.isArray(historyRes.data) &&
            historyRes.data.length > 0
          ) {
            turns = historyRes.data;
          }
        } catch {
          // ignore
        }
      }

      if (turns.length > 0) {
        const mappedMessages: MessageItem[] = turns.map((t) => {
          const roleStr = t.role || t.sender || 'agent';
          const contentStr = t.content || t.text || '';
          const timeStr = t.timestamp
            ? new Date(
                typeof t.timestamp === 'number' ? t.timestamp : t.timestamp
              ).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

          return {
            sender: roleStr.toLowerCase() === 'user' ? 'user' : 'agent',
            text: contentStr,
            time: timeStr,
          };
        });
        setMessages(mappedMessages);
      } else {
        setMessages([
          {
            sender: 'agent',
            text: 'Chào bạn! Tôi là Kyros AI Executive Assistant. Bạn muốn tôi hỗ trợ xếp lịch, quản lý task hay tổng hợp note hôm nay?',
            time: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);
      }
    } catch (err) {
      console.warn('Failed to load turns for conversation', convId, err);
    }
  };

  const startNewConversation = async (wsId: string): Promise<string | null> => {
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
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
      return newConv.id;
    } catch (err) {
      console.warn('Failed to start new conversation', err);
      return null;
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
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
      return;
    }

    const currentWorkspaceId = activeWorkspace.id;

    // Ensure conversation exists on backend before sending message
    let currentConvId = activeConversationId;
    if (!currentConvId) {
      try {
        const res = await apiClient.post(
          `/v1/workspaces/${currentWorkspaceId}/conversations`,
          {
            sessionId: null,
          }
        );
        currentConvId = res.data.id;
        const newConv: ConversationItem = {
          id: res.data.id,
          title: res.data.title || 'Cuộc trò chuyện mới',
          status: res.data.status,
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(currentConvId);
      } catch (err) {
        console.warn('Auto conversation creation fallback', err);
      }
    }

    const userText = inputTurn.trim();
    const noteIdParams = selectedNotes.map((n) => n.id);
    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: MessageItem = { sender: 'user', text: userText, time: now };
    setMessages((prev) => [...prev, userMsg]);
    setInputTurn('');
    setSelectedNotes([]);
    setIsThinking(true);

    if (currentConvId) {
      apiClient
        .post(
          `/v1/workspaces/${currentWorkspaceId}/conversations/${currentConvId}/turns`,
          {
            senderRole: 'USER',
            messageContent: userText,
          }
        )
        .then(() => {
          apiClient
            .get(`/v1/workspaces/${currentWorkspaceId}/conversations`)
            .then((res) => {
              if (res.data && res.data.data) {
                setConversations(res.data.data);
              }
            });
        })
        .catch(() => {});
    }

    const token = localStorage.getItem('token');

    const secureHeaders: Record<string, string> = {
      'X-Workspace-Id': currentWorkspaceId,
    };
    if (token) {
      secureHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (isStreamingMode) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: '',
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isStreaming: true,
        },
      ]);

      try {
        const convParam = currentConvId
          ? `&conversationId=${encodeURIComponent(currentConvId)}`
          : '';
        const notesParam =
          noteIdParams.length > 0
            ? `&noteIds=${noteIdParams.map((id) => encodeURIComponent(id)).join('&noteIds=')}`
            : '';
        const apiBase = getApiBaseUrl();
        const response = await fetch(
          `${apiBase}/v1/workspaces/${currentWorkspaceId}/agent/chat/stream?prompt=${encodeURIComponent(userText)}${convParam}${notesParam}`,
          { headers: secureHeaders }
        );

        if (!response.ok || !response.body)
          throw new Error(
            `Stream HTTP ${response.status}: ${response.statusText}`
          );

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullAgentResponse = '';
        let currentEvent = 'message';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('event:')) {
              currentEvent = trimmed.replace('event:', '').trim();
            } else if (trimmed.startsWith('data:')) {
              const dataText = trimmed.replace('data:', '').trim();

              if (currentEvent === 'thought') {
                setMessages((prev) => {
                  const next = [...prev];
                  if (
                    next.length > 0 &&
                    next[next.length - 1].sender === 'agent'
                  ) {
                    const last = next[next.length - 1];
                    const steps = last.thoughtSteps || [];
                    const updatedSteps = last.activeThoughtStatus
                      ? [...steps, last.activeThoughtStatus]
                      : steps;
                    next[next.length - 1] = {
                      ...last,
                      activeThoughtStatus: dataText,
                      thoughtSteps: updatedSteps,
                    };
                  }
                  return next;
                });
              } else if (currentEvent === 'observation') {
                setMessages((prev) => {
                  const next = [...prev];
                  if (
                    next.length > 0 &&
                    next[next.length - 1].sender === 'agent'
                  ) {
                    const last = next[next.length - 1];
                    const steps = last.thoughtSteps || [];
                    const updatedSteps = last.activeThoughtStatus
                      ? [...steps, last.activeThoughtStatus]
                      : steps;
                    next[next.length - 1] = {
                      ...last,
                      activeThoughtStatus: `🔧 ${dataText}`,
                      thoughtSteps: updatedSteps,
                    };
                  }
                  return next;
                });
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
                setMessages((prev) => {
                  const next = [...prev];
                  if (
                    next.length > 0 &&
                    next[next.length - 1].sender === 'agent'
                  ) {
                    const last = next[next.length - 1];
                    const steps = last.thoughtSteps || [];
                    const updatedSteps = last.activeThoughtStatus
                      ? [...steps, last.activeThoughtStatus]
                      : steps;
                    next[next.length - 1] = {
                      ...last,
                      activeThoughtStatus: undefined,
                      thoughtSteps: updatedSteps,
                      isStreaming: false,
                    };
                  }
                  return next;
                });
              } else if (currentEvent === 'chunk') {
                fullAgentResponse += dataText + '\n';
              }

              const currentContent = fullAgentResponse;
              setMessages((prev) => {
                const next = [...prev];
                if (
                  next.length > 0 &&
                  next[next.length - 1].sender === 'agent'
                ) {
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

        if (currentConvId && fullAgentResponse.trim()) {
          apiClient
            .post(
              `/v1/workspaces/${currentWorkspaceId}/conversations/${currentConvId}/turns`,
              {
                senderRole: 'ASSISTANT',
                messageContent: fullAgentResponse.trim(),
              }
            )
            .catch(() => {});
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
              time: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              isStreaming: false,
            };
          } else {
            next.push({
              sender: 'agent',
              text: errorText,
              time: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            });
          }
          return next;
        });
      }
    } else {
      try {
        const apiBase = getApiBaseUrl();
        const response = await fetch(
          `${apiBase}/v1/workspaces/${currentWorkspaceId}/agent/chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...secureHeaders,
            },
            body: JSON.stringify({ prompt: userText, noteIds: noteIdParams }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setIsThinking(false);
          const time = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          let finalAnswerText = data.finalAnswer || '';

          if (data.pendingApproval) {
            setPendingApproval({
              toolName: data.pendingToolName,
              argumentsJson: data.pendingToolArguments,
              reason: data.approvalReason,
            });
            finalAnswerText = `⚠️ **[CẦN PHÊ DUYỆT]**: ${data.approvalReason}\n*Công cụ:* \`${data.pendingToolName}\``;
          }

          setMessages((prev) => [
            ...prev,
            { sender: 'agent', text: finalAnswerText, time },
          ]);

          if (currentConvId && finalAnswerText.trim()) {
            apiClient
              .post(
                `/v1/workspaces/${currentWorkspaceId}/conversations/${currentConvId}/turns`,
                {
                  senderRole: 'ASSISTANT',
                  messageContent: finalAnswerText.trim(),
                }
              )
              .catch(() => {});
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
            time: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);
      }
    }
  };

  const handleApproveAction = async () => {
    if (!pendingApproval || !activeWorkspace) return;
    setIsThinking(true);
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(
        `${apiBase}/v1/workspaces/${activeWorkspace.id}/agent/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolName: pendingApproval.toolName,
            argumentsJson: pendingApproval.argumentsJson,
          }),
        }
      );
      setIsThinking(false);
      if (response.ok) {
        const data = await response.json();
        setPendingApproval(null);
        setMessages((prev) => [
          ...prev,
          {
            sender: 'agent',
            text: data.finalAnswer,
            time: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
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
      await apiClient.delete(
        `/v1/workspaces/${activeWorkspace.id}/conversations/${convId}`
      );
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

  return {
    activeWorkspace,
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    inputTurn,
    setInputTurn,
    selectedNotes,
    setSelectedNotes,
    isThinking,
    isStreamingMode,
    setIsStreamingMode,
    showConfigModal,
    setShowConfigModal,
    pendingApproval,
    setPendingApproval,
    chatContainerRef,
    handleSendMessage,
    handleApproveAction,
    handleDeleteConversation,
    startNewConversation,
    loadConversationTurns,
  };
};
