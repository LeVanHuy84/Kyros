package com.assistant.memory.presentation.dto;

import java.time.Instant;
import java.util.UUID;

public record ConversationSummaryResponse(
    UUID id, UUID workspaceId, String title, Instant lastTurnTimestamp, String status) {}
