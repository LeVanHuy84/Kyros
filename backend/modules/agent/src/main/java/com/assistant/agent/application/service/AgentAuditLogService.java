package com.assistant.agent.application.service;

import com.assistant.agent.domain.model.AgentAuditLog;
import com.assistant.agent.domain.repository.AgentAuditLogRepository;
import java.time.Instant;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for recording and querying AI agent execution audits. Strictly decoupled from
 * database persistence details via {@link AgentAuditLogRepository}.
 */
@Service
public class AgentAuditLogService {

  private static final Logger log = LoggerFactory.getLogger(AgentAuditLogService.class);

  private final AgentAuditLogRepository auditLogRepository;

  public AgentAuditLogService(AgentAuditLogRepository auditLogRepository) {
    this.auditLogRepository = auditLogRepository;
  }

  @Async
  @Transactional
  public void recordExecution(
      UUID workspaceId,
      @Nullable UUID userId,
      @Nullable UUID conversationId,
      @Nullable String provider,
      @Nullable String modelName,
      @Nullable Integer promptTokens,
      @Nullable Integer completionTokens,
      @Nullable Long totalLatencyMs,
      @Nullable String toolsInvokedJson) {
    try {
      AgentAuditLog auditLog =
          new AgentAuditLog(
              UUID.randomUUID(),
              workspaceId,
              userId,
              conversationId,
              provider,
              modelName,
              promptTokens,
              completionTokens,
              totalLatencyMs,
              toolsInvokedJson,
              Instant.now());
      auditLogRepository.save(auditLog);
      log.debug(
          "Recorded AI audit trace: ws={} model={} promptTokens={} completionTokens={}"
              + " latency={}ms",
          workspaceId,
          modelName,
          promptTokens,
          completionTokens,
          totalLatencyMs);
    } catch (Exception e) {
      log.warn("Failed to persist agent audit log: {}", e.getMessage());
    }
  }
}
