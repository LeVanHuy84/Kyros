package com.assistant.agent.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

@Entity
@Table(name = "agent_audit_logs", schema = "agent")
public class AgentAuditLogJpaEntity {

  @Id private UUID id;

  @Column(name = "workspace_id", nullable = false)
  private UUID workspaceId;

  @Column(name = "user_id")
  @Nullable
  private UUID userId;

  @Column(name = "conversation_id")
  @Nullable
  private UUID conversationId;

  @Column(name = "provider", length = 50)
  @Nullable
  private String provider;

  @Column(name = "model_name", length = 100)
  @Nullable
  private String modelName;

  @Column(name = "prompt_tokens")
  @Nullable
  private Integer promptTokens;

  @Column(name = "completion_tokens")
  @Nullable
  private Integer completionTokens;

  @Column(name = "total_latency_ms")
  @Nullable
  private Long totalLatencyMs;

  @Column(name = "tools_invoked_json", columnDefinition = "JSONB")
  @Nullable
  private String toolsInvokedJson;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  public AgentAuditLogJpaEntity() {}

  public AgentAuditLogJpaEntity(
      UUID id,
      UUID workspaceId,
      @Nullable UUID userId,
      @Nullable UUID conversationId,
      @Nullable String provider,
      @Nullable String modelName,
      @Nullable Integer promptTokens,
      @Nullable Integer completionTokens,
      @Nullable Long totalLatencyMs,
      @Nullable String toolsInvokedJson,
      Instant createdAt) {
    this.id = id;
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.conversationId = conversationId;
    this.provider = provider;
    this.modelName = modelName;
    this.promptTokens = promptTokens;
    this.completionTokens = completionTokens;
    this.totalLatencyMs = totalLatencyMs;
    this.toolsInvokedJson = toolsInvokedJson;
    this.createdAt = createdAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getWorkspaceId() {
    return workspaceId;
  }

  @Nullable
  public UUID getUserId() {
    return userId;
  }

  @Nullable
  public UUID getConversationId() {
    return conversationId;
  }

  @Nullable
  public String getProvider() {
    return provider;
  }

  @Nullable
  public String getModelName() {
    return modelName;
  }

  @Nullable
  public Integer getPromptTokens() {
    return promptTokens;
  }

  @Nullable
  public Integer getCompletionTokens() {
    return completionTokens;
  }

  @Nullable
  public Long getTotalLatencyMs() {
    return totalLatencyMs;
  }

  @Nullable
  public String getToolsInvokedJson() {
    return toolsInvokedJson;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
