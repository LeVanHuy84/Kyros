package com.assistant.notification.domain.model;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public class InAppNotification {
  private final UUID id;
  private final WorkspaceId workspaceId;
  private final UserId userId;
  private final String title;
  private final String content;
  private final UrgencyLevel urgencyLevel;
  private InAppNotificationStatus status;
  private Instant readAt;
  private Instant dismissedAt;
  private final Instant createdAt;
  private Instant updatedAt;
  private int version;

  public InAppNotification(
      UUID id,
      WorkspaceId workspaceId,
      UserId userId,
      String title,
      String content,
      UrgencyLevel urgencyLevel,
      InAppNotificationStatus status,
      Instant readAt,
      Instant dismissedAt,
      Instant createdAt,
      Instant updatedAt,
      int version) {
    this.id = Objects.requireNonNull(id, "ID cannot be null");
    this.workspaceId = Objects.requireNonNull(workspaceId, "Workspace ID cannot be null");
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    if (title == null || title.trim().isEmpty()) {
      throw new IllegalArgumentException("Title cannot be empty");
    }
    this.title = title.trim();
    this.content = Objects.requireNonNull(content, "Content cannot be null");
    this.urgencyLevel = Objects.requireNonNull(urgencyLevel, "Urgency level cannot be null");
    this.status = Objects.requireNonNull(status, "Status cannot be null");
    this.readAt = readAt;
    this.dismissedAt = dismissedAt;
    this.createdAt = Objects.requireNonNull(createdAt, "CreatedAt cannot be null");
    this.updatedAt = Objects.requireNonNull(updatedAt, "UpdatedAt cannot be null");
    this.version = version;
  }

  public InAppNotification(
      WorkspaceId workspaceId,
      UserId userId,
      String title,
      String content,
      UrgencyLevel urgencyLevel) {
    this(
        UUID.randomUUID(),
        workspaceId,
        userId,
        title,
        content,
        urgencyLevel,
        InAppNotificationStatus.Unread,
        null,
        null,
        Instant.now(),
        Instant.now(),
        0);
  }

  public void markRead() {
    if (this.status == InAppNotificationStatus.Dismissed) {
      throw new IllegalStateException("Cannot mark a dismissed notification as read");
    }
    if (this.status == InAppNotificationStatus.Unread) {
      this.status = InAppNotificationStatus.Read;
      this.readAt = Instant.now();
      this.updatedAt = Instant.now();
    }
  }

  public void dismiss() {
    if (this.status != InAppNotificationStatus.Dismissed) {
      this.status = InAppNotificationStatus.Dismissed;
      this.dismissedAt = Instant.now();
      this.updatedAt = Instant.now();
    }
  }

  public UUID getId() {
    return id;
  }

  public WorkspaceId getWorkspaceId() {
    return workspaceId;
  }

  public UserId getUserId() {
    return userId;
  }

  public String getTitle() {
    return title;
  }

  public String getContent() {
    return content;
  }

  public UrgencyLevel getUrgencyLevel() {
    return urgencyLevel;
  }

  public InAppNotificationStatus getStatus() {
    return status;
  }

  public Instant getReadAt() {
    return readAt;
  }

  public Instant getDismissedAt() {
    return dismissedAt;
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
