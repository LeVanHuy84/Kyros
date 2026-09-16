package com.assistant.agent.domain.model;

public record ToolExecutionResult(
    boolean success,
    String output,
    boolean requiresApproval,
    String approvalReason
) {
  public static ToolExecutionResult ok(String output) {
    return new ToolExecutionResult(true, output, false, null);
  }

  public static ToolExecutionResult error(String errorMsg) {
    return new ToolExecutionResult(false, errorMsg, false, null);
  }

  public static ToolExecutionResult approvalRequired(String reason) {
    return new ToolExecutionResult(false, null, true, reason);
  }
}
