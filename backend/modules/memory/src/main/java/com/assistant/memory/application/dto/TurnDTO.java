package com.assistant.memory.application.dto;

import java.time.Instant;
import java.util.UUID;

public record TurnDTO(UUID id, String role, String content, Instant timestamp) {}
