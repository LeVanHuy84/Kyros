package com.assistant.memory.presentation.dto;

import java.time.Instant;
import java.util.UUID;

public record MemoryEntryResponse(
    UUID id,
    UUID workspaceId,
    String content,
    float confidenceScore,
    Instant createdAt,
    Instant updatedAt) {}
