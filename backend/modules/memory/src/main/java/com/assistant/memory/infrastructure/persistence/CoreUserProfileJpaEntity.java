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
@Table(name = "core_user_profiles", schema = "memory")
@Filter(name = "workspaceFilter", condition = "workspace_id = :workspaceId")
public class CoreUserProfileJpaEntity {

  @Id
  @Column(name = "id")
  private UUID id;

  @Column(name = "workspace_id", nullable = false)
  private UUID workspaceId;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "markdown_content", nullable = false, columnDefinition = "TEXT")
  private String markdownContent;

  @Column(name = "last_synthesized_at", nullable = false)
  private Instant lastSynthesizedAt;

  @Column(name = "fact_count", nullable = false)
  private int factCount;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Version
  @Column(name = "version")
  private int version;

  public CoreUserProfileJpaEntity() {}

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

  public String getMarkdownContent() {
    return markdownContent;
  }

  public void setMarkdownContent(String markdownContent) {
    this.markdownContent = markdownContent;
  }

  public Instant getLastSynthesizedAt() {
    return lastSynthesizedAt;
  }

  public void setLastSynthesizedAt(Instant lastSynthesizedAt) {
    this.lastSynthesizedAt = lastSynthesizedAt;
  }

  public int getFactCount() {
    return factCount;
  }

  public void setFactCount(int factCount) {
    this.factCount = factCount;
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
