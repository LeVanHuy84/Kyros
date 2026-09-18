package com.assistant.agent.domain.model;

import java.time.Instant;
import java.util.UUID;

public class UserAiConfig {

  private UUID id;
  private UUID workspaceId;
  private UUID userId;
  private String provider;
  private String apiKeyEncrypted;
  private String baseUrl;
  private String model;
  private Instant createdAt;
  private Instant updatedAt;

  public UserAiConfig(
      UUID id,
      UUID workspaceId,
      UUID userId,
      String provider,
      String apiKeyEncrypted,
      String baseUrl,
      String model,
      Instant createdAt,
      Instant updatedAt) {
    this.id = id;
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.provider = provider;
    this.apiKeyEncrypted = apiKeyEncrypted;
    this.baseUrl = baseUrl;
    this.model = model;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getWorkspaceId() {
    return workspaceId;
  }

  public UUID getUserId() {
    return userId;
  }

  public String getProvider() {
    return provider;
  }

  public void setProvider(String provider) {
    this.provider = provider;
  }

  public String getApiKeyEncrypted() {
    return apiKeyEncrypted;
  }

  public void setApiKeyEncrypted(String apiKeyEncrypted) {
    this.apiKeyEncrypted = apiKeyEncrypted;
  }

  public String getBaseUrl() {
    return baseUrl;
  }

  public void setBaseUrl(String baseUrl) {
    this.baseUrl = baseUrl;
  }

  public String getModel() {
    return model;
  }

  public void setModel(String model) {
    this.model = model;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}
