package com.assistant.memory.domain.model;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.Objects;

/**
 * Domain entity representing an atomic memory entry in the Vault. Supports lifecycle tracking
 * (ACTIVE, SUPERSEDED, ARCHIVED, EXPIRED), time validity windows, access counting, and superseding
 * chains.
 */
public class MemoryEntry {
  private final MemoryId id;
  private final WorkspaceId workspaceId;
  private final UserId userId;
  private String topicCluster;
  private String content;
  private float confidenceScore;
  private MemoryStatus status;
  private MemoryId supersededById;
  private Instant validFrom;
  private Instant validTo;
  private Instant lastAccessedAt;
  private int accessCount;
  private final Instant createdAt;
  private Instant updatedAt;
  private int version;

  public MemoryEntry(
      MemoryId id,
      WorkspaceId workspaceId,
      UserId userId,
      String topicCluster,
      String content,
      float confidenceScore,
      MemoryStatus status,
      MemoryId supersededById,
      Instant validFrom,
      Instant validTo,
      Instant lastAccessedAt,
      int accessCount,
      Instant createdAt,
      Instant updatedAt,
      int version) {
    this.id = Objects.requireNonNull(id, "Memory ID cannot be null");
    this.workspaceId = Objects.requireNonNull(workspaceId, "Workspace ID cannot be null");
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    this.topicCluster = topicCluster;
    setContent(content);
    setConfidenceScore(confidenceScore);
    this.status = status != null ? status : MemoryStatus.ACTIVE;
    this.supersededById = supersededById;
    this.validFrom = validFrom != null ? validFrom : Instant.now();
    this.validTo = validTo;
    this.lastAccessedAt = lastAccessedAt != null ? lastAccessedAt : Instant.now();
    this.accessCount = Math.max(1, accessCount);
    this.createdAt = Objects.requireNonNull(createdAt, "CreatedAt cannot be null");
    this.updatedAt = Objects.requireNonNull(updatedAt, "UpdatedAt cannot be null");
    this.version = version;
  }

  public MemoryEntry(
      MemoryId id,
      WorkspaceId workspaceId,
      UserId userId,
      String content,
      float confidenceScore,
      Instant createdAt,
      Instant updatedAt,
      int version) {
    this(
        id,
        workspaceId,
        userId,
        null,
        content,
        confidenceScore,
        MemoryStatus.ACTIVE,
        null,
        createdAt,
        null,
        createdAt,
        1,
        createdAt,
        updatedAt,
        version);
  }

  public MemoryEntry(
      MemoryId id, WorkspaceId workspaceId, UserId userId, String content, float confidenceScore) {
    this(id, workspaceId, userId, content, confidenceScore, Instant.now(), Instant.now(), 0);
  }

  public MemoryEntry(
      MemoryId id,
      WorkspaceId workspaceId,
      UserId userId,
      String topicCluster,
      String content,
      float confidenceScore) {
    this(
        id,
        workspaceId,
        userId,
        topicCluster,
        content,
        confidenceScore,
        MemoryStatus.ACTIVE,
        null,
        Instant.now(),
        null,
        Instant.now(),
        1,
        Instant.now(),
        Instant.now(),
        0);
  }

  /** Revises this entry's content and score in place (e.g., small clarification). */
  public void revise(String content, float confidenceScore) {
    setContent(content);
    setConfidenceScore(confidenceScore);
    touchAccess();
    this.updatedAt = Instant.now();
  }

  /** Marks this entry as superseded by a newer contradicting memory fact. */
  public void supersede(MemoryId newMemoryId) {
    this.status = MemoryStatus.SUPERSEDED;
    this.supersededById = newMemoryId;
    this.validTo = Instant.now();
    this.updatedAt = Instant.now();
  }

  /** Records an access to this memory entry, reinforcing its retention and resetting decay. */
  public void touchAccess() {
    this.accessCount++;
    this.lastAccessedAt = Instant.now();
  }

  /** Archives this memory entry when it decays below the retention threshold. */
  public void archive() {
    this.status = MemoryStatus.ARCHIVED;
    this.updatedAt = Instant.now();
  }

  /** Expires this memory entry if it was temporary context that passed its TTL. */
  public void expire() {
    this.status = MemoryStatus.EXPIRED;
    this.validTo = Instant.now();
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

  public void setTopicCluster(String topicCluster) {
    this.topicCluster = topicCluster;
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

  public String getTopicCluster() {
    return topicCluster;
  }

  public String getContent() {
    return content;
  }

  public float getConfidenceScore() {
    return confidenceScore;
  }

  public MemoryStatus getStatus() {
    return status;
  }

  public MemoryId getSupersededById() {
    return supersededById;
  }

  public Instant getValidFrom() {
    return validFrom;
  }

  public Instant getValidTo() {
    return validTo;
  }

  public Instant getLastAccessedAt() {
    return lastAccessedAt;
  }

  public int getAccessCount() {
    return accessCount;
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
