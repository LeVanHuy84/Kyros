package com.assistant.agent.presentation.dto;

import java.util.UUID;

public record AgentChatRequest(
    String prompt,
    UUID userId,
    String provider,
    String apiKey,
    String baseUrl,
    String model
) {}
