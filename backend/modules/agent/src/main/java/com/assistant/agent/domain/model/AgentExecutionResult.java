package com.assistant.agent.domain.model;

import java.util.List;

public record AgentExecutionResult(
    String finalAnswer,
    List<AgentTurn> turns,
    boolean pendingApproval,
    String approvalReason,
    String pendingToolName,
    String pendingToolArguments) {
  public static AgentExecutionResult completed(String finalAnswer, List<AgentTurn> turns) {
    return new AgentExecutionResult(finalAnswer, turns, false, null, null, null);
  }

  public static AgentExecutionResult requiresApproval(
      List<AgentTurn> turns, String approvalReason, String toolName, String toolArguments) {
    return new AgentExecutionResult(null, turns, true, approvalReason, toolName, toolArguments);
  }
}
