package com.assistant.memory.application.dto;

import java.util.UUID;

public record PreferencesDTO(
    UUID workspaceId,
    UUID userId,
    String timezone,
    String defaultPriority,
    boolean preventCalendarOverlap,
    int leadTimeMinutes) {}
