package com.assistant.memory.presentation.dto;

import java.time.Instant;
import java.util.UUID;

public record ConversationTurnResponse(UUID id, String role, String content, Instant timestamp) {}
