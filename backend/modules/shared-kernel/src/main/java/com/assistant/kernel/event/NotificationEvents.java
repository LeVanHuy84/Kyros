package com.assistant.kernel.event;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public final class NotificationEvents {

  private NotificationEvents() {}

  public record InAppNotificationCreated(
      UUID notificationId,
      WorkspaceId workspaceId,
      UserId userId,
      String title,
      String urgencyLevel,
      Instant occurredAt)
      implements DomainEvent {
    public InAppNotificationCreated(
        UUID notificationId,
        WorkspaceId workspaceId,
        UserId userId,
        String title,
        String urgencyLevel) {
      this(notificationId, workspaceId, userId, title, urgencyLevel, Instant.now());
    }
  }

  public record InAppNotificationRead(
      UUID notificationId, WorkspaceId workspaceId, UserId userId, Instant occurredAt)
      implements DomainEvent {
    public InAppNotificationRead(UUID notificationId, WorkspaceId workspaceId, UserId userId) {
      this(notificationId, workspaceId, userId, Instant.now());
    }
  }

  public record InAppNotificationDismissed(
      UUID notificationId, WorkspaceId workspaceId, UserId userId, Instant occurredAt)
      implements DomainEvent {
    public InAppNotificationDismissed(UUID notificationId, WorkspaceId workspaceId, UserId userId) {
      this(notificationId, workspaceId, userId, Instant.now());
    }
  }

  public record NotificationDispatched(
      WorkspaceId workspaceId,
      UserId userId,
      String urgencyLevel,
      Set<String> channelsUsed,
      Instant occurredAt)
      implements DomainEvent {
    public NotificationDispatched(
        WorkspaceId workspaceId, UserId userId, String urgencyLevel, Set<String> channelsUsed) {
      this(workspaceId, userId, urgencyLevel, channelsUsed, Instant.now());
    }
  }

  public record NotificationProfileUpdated(
      UUID profileId,
      WorkspaceId workspaceId,
      UserId userId,
      Set<String> changedFields,
      Instant occurredAt)
      implements DomainEvent {
    public NotificationProfileUpdated(
        UUID profileId, WorkspaceId workspaceId, UserId userId, Set<String> changedFields) {
      this(profileId, workspaceId, userId, changedFields, Instant.now());
    }
  }

  public record NotificationProfileReset(
      UUID profileId, WorkspaceId workspaceId, UserId userId, Instant occurredAt)
      implements DomainEvent {
    public NotificationProfileReset(UUID profileId, WorkspaceId workspaceId, UserId userId) {
      this(profileId, workspaceId, userId, Instant.now());
    }
  }

  public record DigestScheduled(
      WorkspaceId workspaceId, UserId userId, Instant scheduledFor, Instant occurredAt)
      implements DomainEvent {
    public DigestScheduled(WorkspaceId workspaceId, UserId userId, Instant scheduledFor) {
      this(workspaceId, userId, scheduledFor, Instant.now());
    }
  }
}
