package com.assistant.agent.presentation.dto;

import java.util.List;
import java.util.UUID;

public record AgentChatRequest(
    UUID conversationId,
    UUID userId,
    String prompt,
    List<UUID> noteIds,
    String provider,
    String apiKey,
    String baseUrl,
    String model) {}
