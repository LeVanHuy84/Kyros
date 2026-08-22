package com.assistant.memory.infrastructure.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringDataConversationTurnRepository
    extends JpaRepository<ConversationTurnJpaEntity, UUID> {

  @Query(
      "SELECT t FROM ConversationTurnJpaEntity t WHERE t.conversationId = :conversationId ORDER BY"
          + " t.turnTimestamp ASC")
  List<ConversationTurnJpaEntity> findRecentTurns(
      @Param("conversationId") UUID conversationId, Pageable pageable);

  void deleteByConversationId(UUID conversationId);
}
