package com.assistant.agent.domain.model;

public record AgentAction(
    String toolName,
    String argumentsJson
) {}
