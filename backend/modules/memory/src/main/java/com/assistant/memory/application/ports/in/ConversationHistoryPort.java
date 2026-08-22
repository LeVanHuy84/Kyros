package com.assistant.memory.application.ports.in;

import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.application.dto.AppendTurnCommand;
import com.assistant.memory.application.dto.TurnDTO;
import com.assistant.memory.domain.model.ConversationId;
import java.util.List;

public interface ConversationHistoryPort {
  void appendMessage(AppendTurnCommand command);

  void clearHistory(WorkspaceId workspaceId, ConversationId conversationId);

  List<TurnDTO> getRecentTurns(WorkspaceId workspaceId, ConversationId conversationId, int limit);
}
