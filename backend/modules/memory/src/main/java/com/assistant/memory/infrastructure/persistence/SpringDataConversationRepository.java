package com.assistant.memory.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataConversationRepository
    extends JpaRepository<ConversationJpaEntity, UUID> {
  Optional<ConversationJpaEntity> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

  Page<ConversationJpaEntity> findByWorkspaceId(UUID workspaceId, Pageable pageable);

  long countByWorkspaceId(UUID workspaceId);
}
