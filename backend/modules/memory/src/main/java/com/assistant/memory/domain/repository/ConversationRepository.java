package com.assistant.memory.domain.repository;

import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.Conversation;
import com.assistant.memory.domain.model.ConversationId;
import com.assistant.memory.domain.model.ConversationTurn;
import java.util.List;
import java.util.Optional;

public interface ConversationRepository {
  Optional<Conversation> findById(ConversationId id, WorkspaceId workspaceId);

  List<Conversation> findByWorkspace(WorkspaceId workspaceId, int offset, int limit);

  long countByWorkspace(WorkspaceId workspaceId);

  void save(Conversation conversation);

  void appendTurn(ConversationId conversationId, WorkspaceId workspaceId, ConversationTurn turn);

  List<ConversationTurn> findRecentTurns(ConversationId conversationId, int limit);

  void deleteTurns(ConversationId conversationId);
}
