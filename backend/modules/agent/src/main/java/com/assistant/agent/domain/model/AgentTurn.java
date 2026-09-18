package com.assistant.agent.domain.model;

public record AgentTurn(
    int stepNumber,
    AgentThought thought,
    AgentAction action,
    String observation,
    boolean requiresApproval,
    String approvalReason) {}
