import React, { useState, useEffect } from 'react';
import { Bot, Radio, Key, Plus, SunMedium, X } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { useNotes } from '../hooks/useNotes';
import { useAgentChat } from '../hooks/useAgentChat';
import apiClient from '../services/api-client';
import { ByokConfigModal } from '../components/agent/ByokConfigModal';
import { ConversationSidebar } from '../components/agent/ConversationSidebar';
import { ChatWindow } from '../components/agent/ChatWindow';
import { ApprovalBanner } from '../components/agent/ApprovalBanner';
import { ChatInputArea } from '../components/agent/ChatInputArea';
import { ExecutiveBriefingModal } from '../components/agent/ExecutiveBriefingModal';

export const AgentCoordinator: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const { notes } = useNotes();
  const [showBriefingModal, setShowBriefingModal] = useState(false);

  const todayKey = `briefing_dismissed_${new Date().toISOString().slice(0, 10)}`;
  const [isBriefingDismissed, setIsBriefingDismissed] = useState<boolean>(
    () => localStorage.getItem(todayKey) === 'true'
  );
  const [briefingStats, setBriefingStats] = useState<{
    events: number;
    tasks: number;
  } | null>(null);

  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    inputTurn,
    setInputTurn,
    selectedNotes,
    setSelectedNotes,
    documents,
    selectedDocs,
    setSelectedDocs,
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
  } = useAgentChat();

  // Load quick morning briefing preview for the top banner
  useEffect(() => {
    if (!activeWorkspace) return;
    const hour = new Date().getHours();
    const type = hour >= 16 ? 'EVENING' : 'MORNING';

    apiClient
      .get(
        `/v1/workspaces/${activeWorkspace.id}/executive/briefing/today?type=${type}`
      )
      .then((res) => {
        if (res.data) {
          setBriefingStats({
            events: res.data.totalEvents ?? res.data.upcomingEventsCount ?? 0,
            tasks: res.data.totalTasksPending ?? res.data.urgentTasksCount ?? 0,
          });
        }
      })
      .catch(() => {});
  }, [activeWorkspace]);

  const handleMarkBriefingRead = () => {
    localStorage.setItem(todayKey, 'true');
    setIsBriefingDismissed(true);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        minHeight: 0,
        flex: 1,
        backgroundColor: 'var(--bg-app)',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          flex: 1,
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header Title & Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-color)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor:
                  'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.15)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={18} />
            </div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--text-main)',
                margin: 0,
              }}
            >
              Kyros Agent Chat Drawer
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowBriefingModal(true)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                gap: '6px',
                borderColor: 'rgba(245, 158, 11, 0.4)',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                color: '#d97706',
              }}
              title="Xem bản tin điều hành tóm tắt lịch trình & nhiệm vụ trong ngày"
            >
              <SunMedium size={14} />
              <span>Bản tin điều hành</span>
            </button>
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
                color: isStreamingMode
                  ? 'var(--color-primary)'
                  : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Radio size={14} />{' '}
              {isStreamingMode ? 'SSE Streaming ON' : 'REST Standard'}
            </button>
          </div>
        </div>

        {/* Morning / Executive Briefing Floating Alert Banner */}
        {!isBriefingDismissed && briefingStats && (
          <div
            className="fade-in-slide-up"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-main)',
              fontSize: '13px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <SunMedium
                size={18}
                style={{ color: '#d97706', flexShrink: 0 }}
              />
              <span>
                ☀️ <strong>Chào buổi sáng!</strong> Hôm nay bạn có{' '}
                <strong style={{ color: '#3b82f6' }}>
                  {briefingStats.events} cuộc họp
                </strong>{' '}
                và{' '}
                <strong style={{ color: '#ef4444' }}>
                  {briefingStats.tasks} nhiệm vụ
                </strong>{' '}
                cần giải quyết.
              </span>
              <button
                type="button"
                onClick={() => setShowBriefingModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  fontSize: '13px',
                  padding: 0,
                }}
              >
                Bấm để xem tóm tắt điều hành &rarr;
              </button>
            </div>
            <button
              type="button"
              onClick={handleMarkBriefingRead}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Đóng lời nhắc hôm nay"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Modal BYOK Provider Config */}
        <ByokConfigModal
          show={showConfigModal}
          onClose={() => setShowConfigModal(false)}
        />

        {/* Modal Executive Briefing */}
        <ExecutiveBriefingModal
          isOpen={showBriefingModal}
          onClose={() => setShowBriefingModal(false)}
          onMarkRead={handleMarkBriefingRead}
        />

        {/* Main Conversation & Chat Body */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '190px 1fr',
            gap: '16px',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <ConversationSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => {
              setActiveConversationId(id);
              if (activeWorkspace)
                loadConversationTurns(activeWorkspace.id, id);
            }}
            onDeleteConversation={handleDeleteConversation}
          />

          <ChatWindow
            messages={messages}
            isThinking={isThinking}
            chatContainerRef={chatContainerRef}
          />
        </div>

        {/* Chat Input & Mentions Area */}
        <ChatInputArea
          inputTurn={inputTurn}
          setInputTurn={setInputTurn}
          selectedNotes={selectedNotes}
          setSelectedNotes={setSelectedNotes}
          notes={notes}
          selectedDocs={selectedDocs}
          setSelectedDocs={setSelectedDocs}
          documents={documents}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* Human Approval Security Banner */}
      <ApprovalBanner
        pendingApproval={pendingApproval}
        onApprove={handleApproveAction}
        onCancel={() => setPendingApproval(null)}
      />
    </div>
  );
};

export default AgentCoordinator;
