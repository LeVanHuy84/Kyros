package com.assistant.agent.presentation.dto;

import java.util.UUID;

public record AgentApproveRequest(
    UUID conversationId,
    UUID userId,
    String stepId,
    String toolName,
    String argumentsJson,
    boolean approved) {}
