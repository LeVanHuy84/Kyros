package com.assistant.memory.domain.model;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.Objects;

/**
 * Domain entity representing Tier 1: Core User Profile (Working Memory). Contains a consolidated,
 * token-compact Markdown summary of active user rules, work schedule, preferences, and
 * communication style.
 */
public class CoreUserProfile {
  private final WorkspaceId workspaceId;
  private final UserId userId;
  private String markdownContent;
  private Instant lastSynthesizedAt;
  private int factCount;
  private final Instant createdAt;
  private Instant updatedAt;
  private int version;

  public CoreUserProfile(
      WorkspaceId workspaceId,
      UserId userId,
      String markdownContent,
      Instant lastSynthesizedAt,
      int factCount,
      Instant createdAt,
      Instant updatedAt,
      int version) {
    this.workspaceId = Objects.requireNonNull(workspaceId, "Workspace ID cannot be null");
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    this.markdownContent = markdownContent != null ? markdownContent : "";
    this.lastSynthesizedAt = lastSynthesizedAt != null ? lastSynthesizedAt : Instant.now();
    this.factCount = factCount;
    this.createdAt = createdAt != null ? createdAt : Instant.now();
    this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
    this.version = version;
  }

  public CoreUserProfile(
      WorkspaceId workspaceId, UserId userId, String markdownContent, int factCount) {
    this(
        workspaceId,
        userId,
        markdownContent,
        Instant.now(),
        factCount,
        Instant.now(),
        Instant.now(),
        0);
  }

  public void updateProfile(String markdownContent, int factCount) {
    this.markdownContent = markdownContent != null ? markdownContent : "";
    this.factCount = factCount;
    this.lastSynthesizedAt = Instant.now();
    this.updatedAt = Instant.now();
  }

  public WorkspaceId getWorkspaceId() {
    return workspaceId;
  }

  public UserId getUserId() {
    return userId;
  }

  public String getMarkdownContent() {
    return markdownContent;
  }

  public Instant getLastSynthesizedAt() {
    return lastSynthesizedAt;
  }

  public int getFactCount() {
    return factCount;
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
