package com.assistant.memory.domain.model;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public class Conversation {
  private final ConversationId id;
  private final WorkspaceId workspaceId;
  private final UserId userId;
  private final UUID sessionId;
  private String title;
  private ConversationStatus status;
  private Instant lastTurnTimestamp;
  private final Instant createdAt;
  private Instant updatedAt;
  private int version;

  public Conversation(
      ConversationId id,
      WorkspaceId workspaceId,
      UserId userId,
      UUID sessionId,
      String title,
      ConversationStatus status,
      Instant lastTurnTimestamp,
      Instant createdAt,
      Instant updatedAt,
      int version) {
    this.id = Objects.requireNonNull(id, "Conversation ID cannot be null");
    this.workspaceId = Objects.requireNonNull(workspaceId, "Workspace ID cannot be null");
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    this.sessionId = sessionId;
    this.title = (title != null && !title.trim().isEmpty()) ? title.trim() : "New Conversation";
    this.status = Objects.requireNonNull(status, "Status cannot be null");
    this.lastTurnTimestamp = lastTurnTimestamp;
    this.createdAt = Objects.requireNonNull(createdAt, "CreatedAt cannot be null");
    this.updatedAt = Objects.requireNonNull(updatedAt, "UpdatedAt cannot be null");
    this.version = version;
  }

  public Conversation(
      ConversationId id, WorkspaceId workspaceId, UserId userId, UUID sessionId, String title) {
    this(
        id,
        workspaceId,
        userId,
        sessionId,
        title,
        ConversationStatus.Active,
        null,
        Instant.now(),
        Instant.now(),
        0);
  }

  public void appendTurn(SenderRole role, String content, Instant timestamp) {
    if (status == ConversationStatus.Archived) {
      throw new IllegalStateException("Cannot append a turn to an archived conversation");
    }
    Objects.requireNonNull(timestamp, "Timestamp cannot be null");
    if (lastTurnTimestamp != null && !timestamp.isAfter(lastTurnTimestamp)) {
      throw new IllegalArgumentException(
          "New turn timestamp must be strictly after the last turn timestamp");
    }
    this.lastTurnTimestamp = timestamp;
    this.status = ConversationStatus.Active;
    this.updatedAt = Instant.now();
  }

  public void clear() {
    if (status == ConversationStatus.Archived) {
      throw new IllegalStateException("Cannot clear an archived conversation");
    }
    this.status = ConversationStatus.Cleared;
    this.lastTurnTimestamp = null;
    this.updatedAt = Instant.now();
  }

  public void archive() {
    this.status = ConversationStatus.Archived;
    this.updatedAt = Instant.now();
  }

  public void updateTitle(String newTitle) {
    if (status == ConversationStatus.Archived) {
      throw new IllegalStateException("Cannot update title of an archived conversation");
    }
    if (newTitle == null || newTitle.trim().isEmpty()) {
      throw new IllegalArgumentException("Title cannot be empty");
    }
    this.title = newTitle.trim();
    this.updatedAt = Instant.now();
  }

  public ConversationId getId() {
    return id;
  }

  public WorkspaceId getWorkspaceId() {
    return workspaceId;
  }

  public UserId getUserId() {
    return userId;
  }

  public UUID getSessionId() {
    return sessionId;
  }

  public String getTitle() {
    return title;
  }

  public ConversationStatus getStatus() {
    return status;
  }

  public Instant getLastTurnTimestamp() {
    return lastTurnTimestamp;
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
