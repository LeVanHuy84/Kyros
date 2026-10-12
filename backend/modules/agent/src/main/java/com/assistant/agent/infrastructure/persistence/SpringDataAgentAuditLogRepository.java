package com.assistant.agent.infrastructure.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpringDataAgentAuditLogRepository
    extends JpaRepository<AgentAuditLogJpaEntity, UUID> {

  List<AgentAuditLogJpaEntity> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);

  List<AgentAuditLogJpaEntity> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);
}
