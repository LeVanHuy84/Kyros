import React from 'react';
import { Bot, Radio, Key, Plus } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { useNotes } from '../hooks/useNotes';
import { useAgentChat } from '../hooks/useAgentChat';
import { ByokConfigModal } from '../components/agent/ByokConfigModal';
import { ConversationSidebar } from '../components/agent/ConversationSidebar';
import { ChatWindow } from '../components/agent/ChatWindow';
import { ApprovalBanner } from '../components/agent/ApprovalBanner';
import { ChatInputArea } from '../components/agent/ChatInputArea';

export const AgentCoordinator: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const { notes } = useNotes();
  const {
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
  } = useAgentChat();

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
          gap: '16px',
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

        {/* Modal BYOK Provider Config */}
        <ByokConfigModal
          show={showConfigModal}
          onClose={() => setShowConfigModal(false)}
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

        {/* Chat Input & Note Mention Area */}
        <ChatInputArea
          inputTurn={inputTurn}
          setInputTurn={setInputTurn}
          selectedNotes={selectedNotes}
          setSelectedNotes={setSelectedNotes}
          notes={notes}
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
