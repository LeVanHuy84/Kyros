package com.assistant.memory.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "memory_entries", schema = "memory")
@Filter(name = "workspaceFilter", condition = "workspace_id = :workspaceId")
public class MemoryEntryJpaEntity {

  @Id
  @Column(name = "id")
  private UUID id;

  @Column(name = "workspace_id", nullable = false)
  private UUID workspaceId;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "topic_cluster")
  private String topicCluster;

  @Column(name = "content", nullable = false)
  private String content;

  @Column(name = "confidence_score", nullable = false)
  private float confidenceScore;

  @Column(name = "status", nullable = false)
  private String status;

  @Column(name = "superseded_by_id")
  private UUID supersededById;

  @Column(name = "valid_from", nullable = false)
  private Instant validFrom;

  @Column(name = "valid_to")
  private Instant validTo;

  @Column(name = "last_accessed_at", nullable = false)
  private Instant lastAccessedAt;

  @Column(name = "access_count", nullable = false)
  private int accessCount;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Version
  @Column(name = "version")
  private int version;

  public MemoryEntryJpaEntity() {}

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getWorkspaceId() {
    return workspaceId;
  }

  public void setWorkspaceId(UUID workspaceId) {
    this.workspaceId = workspaceId;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public String getTopicCluster() {
    return topicCluster;
  }

  public void setTopicCluster(String topicCluster) {
    this.topicCluster = topicCluster;
  }

  public String getContent() {
    return content;
  }

  public void setContent(String content) {
    this.content = content;
  }

  public float getConfidenceScore() {
    return confidenceScore;
  }

  public void setConfidenceScore(float confidenceScore) {
    this.confidenceScore = confidenceScore;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public UUID getSupersededById() {
    return supersededById;
  }

  public void setSupersededById(UUID supersededById) {
    this.supersededById = supersededById;
  }

  public Instant getValidFrom() {
    return validFrom;
  }

  public void setValidFrom(Instant validFrom) {
    this.validFrom = validFrom;
  }

  public Instant getValidTo() {
    return validTo;
  }

  public void setValidTo(Instant validTo) {
    this.validTo = validTo;
  }

  public Instant getLastAccessedAt() {
    return lastAccessedAt;
  }

  public void setLastAccessedAt(Instant lastAccessedAt) {
    this.lastAccessedAt = lastAccessedAt;
  }

  public int getAccessCount() {
    return accessCount;
  }

  public void setAccessCount(int accessCount) {
    this.accessCount = accessCount;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  public int getVersion() {
    return version;
  }

  public void setVersion(int version) {
    this.version = version;
  }
}
