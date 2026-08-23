package com.assistant.notification.application.dto;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.util.UUID;

public record MarkNotificationReadCommand(
    WorkspaceId workspaceId, UserId userId, UUID notificationId) {}
