package com.assistant.memory.application.dto;

import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.ConversationId;
import com.assistant.memory.domain.model.SenderRole;

public record AppendTurnCommand(
    WorkspaceId workspaceId,
    ConversationId conversationId,
    SenderRole senderRole,
    String messageContent) {}
