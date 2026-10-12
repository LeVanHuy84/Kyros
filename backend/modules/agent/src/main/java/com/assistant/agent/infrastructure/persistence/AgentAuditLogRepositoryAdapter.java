package com.assistant.agent.infrastructure.persistence;

import com.assistant.agent.domain.model.AgentAuditLog;
import com.assistant.agent.domain.repository.AgentAuditLogRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class AgentAuditLogRepositoryAdapter implements AgentAuditLogRepository {

  private final SpringDataAgentAuditLogRepository repository;

  public AgentAuditLogRepositoryAdapter(SpringDataAgentAuditLogRepository repository) {
    this.repository = repository;
  }

  @Override
  public AgentAuditLog save(AgentAuditLog log) {
    AgentAuditLogJpaEntity entity =
        new AgentAuditLogJpaEntity(
            log.getId(),
            log.getWorkspaceId(),
            log.getUserId(),
            log.getConversationId(),
            log.getProvider(),
            log.getModelName(),
            log.getPromptTokens(),
            log.getCompletionTokens(),
            log.getTotalLatencyMs(),
            log.getToolsInvokedJson(),
            log.getCreatedAt());

    AgentAuditLogJpaEntity saved = repository.save(entity);
    return toDomain(saved);
  }

  @Override
  public List<AgentAuditLog> findByWorkspaceId(UUID workspaceId) {
    return repository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId).stream()
        .map(this::toDomain)
        .toList();
  }

  private AgentAuditLog toDomain(AgentAuditLogJpaEntity entity) {
    return new AgentAuditLog(
        entity.getId(),
        entity.getWorkspaceId(),
        entity.getUserId(),
        entity.getConversationId(),
        entity.getProvider(),
        entity.getModelName(),
        entity.getPromptTokens(),
        entity.getCompletionTokens(),
        entity.getTotalLatencyMs(),
        entity.getToolsInvokedJson(),
        entity.getCreatedAt());
  }
}
