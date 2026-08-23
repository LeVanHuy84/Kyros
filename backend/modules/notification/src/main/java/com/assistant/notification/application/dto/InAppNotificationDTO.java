package com.assistant.notification.application.dto;

import java.time.Instant;
import java.util.UUID;

public record InAppNotificationDTO(
    UUID notificationId,
    UUID workspaceId,
    String title,
    String content,
    String urgencyLevel,
    String status,
    Instant createdAt) {}
