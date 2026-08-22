package com.assistant.memory.domain.model;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.Objects;

public class MemoryEntry {
  private final MemoryId id;
  private final WorkspaceId workspaceId;
  private final UserId userId;
  private String content;
  private float confidenceScore;
  private final Instant createdAt;
  private Instant updatedAt;
  private int version;

  public MemoryEntry(
      MemoryId id,
      WorkspaceId workspaceId,
      UserId userId,
      String content,
      float confidenceScore,
      Instant createdAt,
      Instant updatedAt,
      int version) {
    this.id = Objects.requireNonNull(id, "Memory ID cannot be null");
    this.workspaceId = Objects.requireNonNull(workspaceId, "Workspace ID cannot be null");
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    setContent(content);
    setConfidenceScore(confidenceScore);
    this.createdAt = Objects.requireNonNull(createdAt, "CreatedAt cannot be null");
    this.updatedAt = Objects.requireNonNull(updatedAt, "UpdatedAt cannot be null");
    this.version = version;
  }

  public MemoryEntry(
      MemoryId id, WorkspaceId workspaceId, UserId userId, String content, float confidenceScore) {
    this(id, workspaceId, userId, content, confidenceScore, Instant.now(), Instant.now(), 0);
  }

  public void revise(String content, float confidenceScore) {
    setContent(content);
    setConfidenceScore(confidenceScore);
    this.updatedAt = Instant.now();
  }

  private void setContent(String content) {
    if (content == null || content.trim().isEmpty()) {
      throw new IllegalArgumentException("Fact content cannot be blank");
    }
    this.content = content.trim();
  }

  private void setConfidenceScore(float confidenceScore) {
    if (confidenceScore < 0.0f || confidenceScore > 1.0f) {
      throw new IllegalArgumentException("Confidence score must be between 0.0 and 1.0");
    }
    this.confidenceScore = confidenceScore;
  }

  public MemoryId getId() {
    return id;
  }

  public WorkspaceId getWorkspaceId() {
    return workspaceId;
  }

  public UserId getUserId() {
    return userId;
  }

  public String getContent() {
    return content;
  }

  public float getConfidenceScore() {
    return confidenceScore;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public int getVersion() {
    return version;
  }
}
