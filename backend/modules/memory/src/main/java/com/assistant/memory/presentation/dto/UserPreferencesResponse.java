package com.assistant.memory.presentation.dto;

import java.util.UUID;

public record UserPreferencesResponse(
    UUID workspaceId,
    UUID userId,
    String timezone,
    String defaultPriority,
    boolean preventCalendarOverlap,
    int leadTimeMinutes) {}
