package com.assistant.agent.domain.model;

import java.time.Instant;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public class AgentAuditLog {

  private final UUID id;
  private final UUID workspaceId;
  @Nullable private final UUID userId;
  @Nullable private final UUID conversationId;
  @Nullable private final String provider;
  @Nullable private final String modelName;
  @Nullable private final Integer promptTokens;
  @Nullable private final Integer completionTokens;
  @Nullable private final Long totalLatencyMs;
  @Nullable private final String toolsInvokedJson;
  private final Instant createdAt;

  public AgentAuditLog(
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
