package com.assistant.agent.presentation.dto;

import java.util.UUID;

public record AgentApproveRequest(
    String toolName,
    String argumentsJson,
    UUID userId
) {}
