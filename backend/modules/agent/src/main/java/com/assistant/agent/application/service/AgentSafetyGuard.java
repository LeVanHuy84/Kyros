package com.assistant.agent.application.service;

import com.assistant.agent.domain.model.AgentAction;
import com.assistant.agent.domain.model.AgentExecutionResult;
import com.assistant.agent.domain.model.AgentThought;
import com.assistant.agent.domain.model.AgentTurn;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

/**
 * Safety guard for intercepting destructive agent operations and enforcing Human-in-the-loop
 * approvals across Events, Tasks, Notes, and Memory.
 */
@Component
public class AgentSafetyGuard {

  private static final Set<String> DESTRUCTIVE_TOOLS =
      Set.of("delete_events", "delete_tasks", "delete_notes", "delete_memory");

  private final MessageSource messageSource;

  public AgentSafetyGuard(
      @org.springframework.beans.factory.annotation.Autowired(required = false)
          MessageSource messageSource) {
    this.messageSource = messageSource;
  }

  public record SafetyCheckResult(
      boolean isDestructive,
      String toolName,
      String approvalReason,
      String argumentsJson,
      AgentTurn pendingTurn) {}

  public boolean isDestructiveTool(String toolName) {
    return toolName != null && DESTRUCTIVE_TOOLS.contains(toolName.trim().toLowerCase(Locale.ROOT));
  }

  public SafetyCheckResult evaluateToolCall(String toolName, String argumentsJson, Locale locale) {
    if (!isDestructiveTool(toolName)) {
      return new SafetyCheckResult(false, toolName, null, argumentsJson, null);
    }

    String approvalReason = getApprovalReasonForTool(toolName, locale);

    AgentTurn pendingTurn =
        new AgentTurn(
            1,
            new AgentThought(
                msg(
                    "agent.thought.dangerous_action_detected",
                    new Object[] {toolName},
                    "Dangerous operation detected (" + toolName + "), pausing for user approval.",
                    locale)),
            new AgentAction(toolName, argumentsJson),
            msg("agent.thought.waiting_approval", null, "Waiting for user confirmation.", locale),
            true,
            approvalReason);

    return new SafetyCheckResult(true, toolName, approvalReason, argumentsJson, pendingTurn);
  }

  public SafetyCheckResult evaluatePrompt(UUID workspaceId, String prompt, Locale locale) {
    String lowerPrompt = prompt.toLowerCase(Locale.ROOT);
    boolean isDelete =
        lowerPrompt.contains("xóa")
            || lowerPrompt.contains("delete")
            || lowerPrompt.contains("remove")
            || lowerPrompt.contains("hủy")
            || lowerPrompt.contains("cancel")
            || lowerPrompt.contains("purge")
            || lowerPrompt.contains("drop");

    if (!isDelete) {
      return new SafetyCheckResult(false, null, null, null, null);
    }

    String toolName;
    if (lowerPrompt.contains("ghi chú")
        || lowerPrompt.contains("note")
        || lowerPrompt.contains("bản nháp")) {
      toolName = "delete_notes";
    } else if (lowerPrompt.contains("trí nhớ")
        || lowerPrompt.contains("memory")
        || lowerPrompt.contains("thói quen")
        || lowerPrompt.contains("vault")) {
      toolName = "delete_memory";
    } else if (lowerPrompt.contains("lịch")
        || lowerPrompt.contains("event")
        || lowerPrompt.contains("meeting")
        || lowerPrompt.contains("họp")) {
      toolName = "delete_events";
    } else {
      toolName = "delete_tasks";
    }

    String approvalReason = getApprovalReasonForTool(toolName, locale);
    String argsJson =
        String.format("{\"workspaceId\":\"%s\",\"target\":\"%s\"}", workspaceId, prompt);

    AgentTurn pendingTurn =
        new AgentTurn(
            1,
            new AgentThought(
                msg(
                    "agent.thought.dangerous_action_detected",
                    new Object[] {toolName},
                    "Dangerous operation detected (" + toolName + "), pausing for user approval.",
                    locale)),
            new AgentAction(toolName, argsJson),
            msg("agent.thought.waiting_approval", null, "Waiting for user confirmation.", locale),
            true,
            approvalReason);

    return new SafetyCheckResult(true, toolName, approvalReason, argsJson, pendingTurn);
  }

  private String getApprovalReasonForTool(String toolName, Locale locale) {
    String itemType =
        switch (toolName) {
          case "delete_events" -> "Lịch hẹn / Sự kiện";
          case "delete_notes" -> "Ghi chú";
          case "delete_memory" -> "Trí nhớ / Memory Vault";
          default -> "Công việc / Tasks";
        };

    return msg(
        "agent.approval.delete_requires_confirmation",
        new Object[] {itemType},
        "Xác nhận an toàn: Thao tác xóa "
            + itemType
            + " ("
            + toolName
            + ") yêu cầu bạn xác nhận trước khi thực hiện.",
        locale);
  }

  public AgentExecutionResult createApprovalResult(SafetyCheckResult safetyResult) {
    return AgentExecutionResult.requiresApproval(
        List.of(safetyResult.pendingTurn()),
        safetyResult.approvalReason(),
        safetyResult.toolName(),
        safetyResult.argumentsJson());
  }

  private String msg(String code, Object[] args, String defaultMessage, Locale locale) {
    if (messageSource == null) {
      if (args != null && args.length > 0) {
        return java.text.MessageFormat.format(defaultMessage, args);
      }
      return defaultMessage;
    }
    Locale effLocale = locale != null ? locale : LocaleContextHolder.getLocale();
    return messageSource.getMessage(code, args, defaultMessage, effLocale);
  }
}
