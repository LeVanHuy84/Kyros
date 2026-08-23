package com.assistant.notification.application.dto;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;

public record GetNotificationProfileQuery(WorkspaceId workspaceId, UserId userId) {}
