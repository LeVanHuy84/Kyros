package com.assistant.notification.application.dto;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.notification.domain.model.UrgencyLevel;
import java.util.Map;

public record DispatchNotificationCommand(
    WorkspaceId workspaceId,
    UserId userId,
    String title,
    String content,
    UrgencyLevel urgencyLevel,
    Map<String, Object> parameters) {}
