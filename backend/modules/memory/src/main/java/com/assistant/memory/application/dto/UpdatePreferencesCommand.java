package com.assistant.memory.application.dto;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;

public record UpdatePreferencesCommand(
    WorkspaceId workspaceId,
    UserId userId,
    String timezone,
    String defaultPriority,
    boolean preventCalendarOverlap,
    int leadTimeMinutes) {}
