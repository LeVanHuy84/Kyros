package com.assistant.notification.presentation.dto;

import com.assistant.notification.domain.model.InAppNotification;
import java.time.Instant;
import java.util.UUID;

public record InAppNotificationResponse(
    UUID notificationId,
    UUID workspaceId,
    String title,
    String content,
    String urgencyLevel,
    String status,
    Instant createdAt) {

  public static InAppNotificationResponse fromDomain(InAppNotification notification) {
    return new InAppNotificationResponse(
        notification.getId(),
        notification.getWorkspaceId().value(),
        notification.getTitle(),
        notification.getContent(),
        notification.getUrgencyLevel().name(),
        notification.getStatus().name(),
        notification.getCreatedAt());
  }
}
