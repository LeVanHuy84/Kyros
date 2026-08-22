package com.assistant.memory.application.dto;

import java.time.Instant;
import java.util.UUID;

public record MemoryEntryDTO(
    UUID id,
    UUID workspaceId,
    String content,
    float confidenceScore,
    Instant createdAt,
    Instant updatedAt) {}
