package com.assistant.memory.application.dto;

import java.time.Instant;
import java.util.UUID;

public record NoteDto(
    UUID id,
    UUID workspaceId,
    UUID userId,
    String title,
    String content,
    UUID taskId,
    UUID eventId,
    Instant createdAt,
    Instant updatedAt) {}
