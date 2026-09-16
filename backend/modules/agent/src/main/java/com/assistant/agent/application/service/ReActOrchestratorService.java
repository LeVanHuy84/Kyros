package com.assistant.agent.application.service;

import com.assistant.agent.domain.llm.LlmPort;
import com.assistant.agent.domain.model.AgentAction;
import com.assistant.agent.domain.model.AgentExecutionResult;
import com.assistant.agent.domain.model.AgentThought;
import com.assistant.agent.domain.model.AgentTurn;
import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class ReActOrchestratorService {

  private static final int MAX_TURNS = 5;

  private final Map<String, AgentToolContract> toolRegistry;
  private final List<AgentToolContract> toolList;
  private final LlmPort llmPort;

  public ReActOrchestratorService(
      List<AgentToolContract> toolContracts, LlmPort llmPort) {
    this.toolList = toolContracts;
    this.toolRegistry =
        toolContracts.stream()
            .collect(Collectors.toMap(AgentToolContract::getName, Function.identity()));
    this.llmPort = llmPort;
  }

  public AgentExecutionResult processUserPrompt(
      UUID workspaceId,
      UUID userId,
      String prompt,
      String provider,
      String apiKey,
      String baseUrl,
      String model) {
    List<AgentTurn> turns = new ArrayList<>();
    String lowerPrompt = prompt.toLowerCase(Locale.ROOT);

    // ReAct Step 1: Safety interception for destructive actions
    if (lowerPrompt.contains("xóa") || lowerPrompt.contains("delete")) {
      String toolName = lowerPrompt.contains("lịch") || lowerPrompt.contains("event") ? "delete_event" : "delete_task";
      String approvalReason = "Thao tác xóa cần sự xác nhận của người dùng.";
      String argsJson = String.format("{\"workspaceId\":\"%s\",\"target\":\"%s\"}", workspaceId, prompt);

      AgentTurn pendingTurn =
          new AgentTurn(
              1,
              new AgentThought("Phát hiện thao tác nguy hiểm (" + toolName + "), tạm dừng để xin phê duyệt từ người dùng."),
              new AgentAction(toolName, argsJson),
              "Chờ xác nhận của người dùng.",
              true,
              approvalReason);
      turns.add(pendingTurn);

      return AgentExecutionResult.requiresApproval(turns, approvalReason, toolName, argsJson);
    }

    boolean hasCustomLlmConfig = (apiKey != null && !apiKey.isBlank()) || (baseUrl != null && !baseUrl.isBlank());

    // Attempt real dynamic LLM call if user provided BYOK API Key or Custom Local LLM (Ollama/LMStudio)
    if (hasCustomLlmConfig) {
      String systemPrompt = "You are Kyros AI Executive Assistant. Choose tools when needed to fulfill user requests.";
      LlmPort.LlmResponse llmResp =
          llmPort.callLlm(baseUrl, apiKey, model, systemPrompt, prompt, toolList);

      if (llmResp.toolCalls() != null && !llmResp.toolCalls().isEmpty()) {
        StringBuilder resultSummary = new StringBuilder();
        int step = 1;
        for (LlmPort.ToolCall tc : llmResp.toolCalls()) {
          if (toolRegistry.containsKey(tc.name())) {
            AgentToolContract tool = toolRegistry.get(tc.name());
            ToolExecutionResult execRes = tool.execute(tc.argumentsJson());

            turns.add(
                new AgentTurn(
                    step++,
                    new AgentThought("LLM (" + (provider != null ? provider : "Local LLM") + ") chọn công cụ: " + tc.name()),
                    new AgentAction(tc.name(), tc.argumentsJson()),
                    execRes.output(),
                    false,
                    null));
            resultSummary.append("- ").append(execRes.output()).append("\n");
          }
        }

        return AgentExecutionResult.completed(
            "Phản hồi từ " + (provider != null ? provider : "LLM") + ":\n" + resultSummary.toString(), turns);
      } else if (llmResp.content() != null && !llmResp.content().isBlank()) {
        return AgentExecutionResult.completed(llmResp.content(), turns);
      }
    }

    // Fallback: Rule-based ReAct cognitive engine
    List<AgentAction> plannedActions = planActions(workspaceId, userId, prompt);
    int step = 1;
    for (AgentAction action : plannedActions) {
      if (step > MAX_TURNS) break;

      AgentToolContract tool = toolRegistry.get(action.toolName());
      if (tool == null) continue;

      AgentThought thought =
          new AgentThought("Sử dụng công cụ " + tool.getName() + " thực hiện yêu cầu.");
      ToolExecutionResult result = tool.execute(action.argumentsJson());

      turns.add(
          new AgentTurn(
              step++,
              thought,
              action,
              result.output() != null ? result.output() : result.approvalReason(),
              result.requiresApproval(),
              result.approvalReason()));
    }

    String summaryAnswer =
        turns.isEmpty()
            ? "Tôi đã tiếp nhận yêu cầu: \"" + prompt + "\". Hệ thống đã sẵn sàng hỗ trợ bạn."
            : "Đã hoàn thành các bước xử lý agentic. Chi tiết các thao tác đã thực thi:\n"
                + turns.stream()
                    .map(t -> "- Bước " + t.stepNumber() + ": " + t.observation())
                    .collect(Collectors.joining("\n"));

    return AgentExecutionResult.completed(summaryAnswer, turns);
  }

  public AgentExecutionResult processUserPrompt(UUID workspaceId, UUID userId, String prompt) {
    return processUserPrompt(workspaceId, userId, prompt, null, null, null, null);
  }

  public void streamUserPrompt(
      UUID workspaceId,
      UUID userId,
      String prompt,
      String provider,
      String apiKey,
      String baseUrl,
      String model,
      SseEmitter emitter) {
    com.assistant.kernel.domain.WorkspaceId activeWsId =
        new com.assistant.kernel.domain.WorkspaceId(workspaceId);

    CompletableFuture.runAsync(() -> {
      try {
        com.assistant.kernel.context.WorkspaceContextHolder.set(activeWsId);

        String lowerPrompt = prompt.toLowerCase(Locale.ROOT);

        if (lowerPrompt.contains("xóa") || lowerPrompt.contains("delete")) {
          String toolName = lowerPrompt.contains("lịch") || lowerPrompt.contains("event") ? "delete_event" : "delete_task";
          String approvalReason = "Thao tác xóa cần sự xác nhận của người dùng.";
          String argsJson = String.format("{\"workspaceId\":\"%s\",\"target\":\"%s\"}", workspaceId, prompt);

          emitter.send(SseEmitter.event().name("approval").data(
              String.format("{\"pendingApproval\":true,\"toolName\":\"%s\",\"reason\":\"%s\",\"argumentsJson\":%s}",
                  toolName, approvalReason, objectMapperEscape(argsJson))));
          emitter.complete();
          return;
        }

        boolean hasCustomLlmConfig = (apiKey != null && !apiKey.isBlank()) || (baseUrl != null && !baseUrl.isBlank());

        if (hasCustomLlmConfig) {
          emitter.send(SseEmitter.event().name("thought").data("Đang kết nối tới " + (provider != null ? provider : "Local Ollama") + " (" + (model != null ? model : "default") + ")..."));
          LlmPort.LlmResponse llmResp =
              llmPort.callLlm(baseUrl, apiKey, model, "You are Kyros AI Assistant.", prompt, toolList);

          if (llmResp.toolCalls() != null && !llmResp.toolCalls().isEmpty()) {
            StringBuilder executionLogs = new StringBuilder();
            for (LlmPort.ToolCall tc : llmResp.toolCalls()) {
              if (toolRegistry.containsKey(tc.name())) {
                AgentToolContract tool = toolRegistry.get(tc.name());
                emitter.send(SseEmitter.event().name("thought").data("LLM quyết định gọi công cụ: " + tool.getName()));
                ToolExecutionResult execRes = tool.execute(tc.argumentsJson());
                emitter.send(SseEmitter.event().name("observation").data("thành công - " + execRes.output()));
                executionLogs.append("- ").append(tool.getName()).append(": ").append(execRes.output()).append("\n");
              }
            }
            emitter.send(SseEmitter.event().name("completed").data("Hoàn tất thực thi " + llmResp.toolCalls().size() + " công cụ."));
            emitter.complete();
            return;
          } else if (llmResp.content() != null && !llmResp.content().isBlank()) {
            emitter.send(SseEmitter.event().name("chunk").data(llmResp.content()));
            emitter.send(SseEmitter.event().name("completed").data("Hoàn thành."));
            emitter.complete();
            return;
          } else {
            emitter.send(SseEmitter.event().name("chunk").data("⚠️ Không nhận được phản hồi từ Ollama/LLM Engine. Kiểm tra thông số Endpoint/Model."));
            emitter.send(SseEmitter.event().name("completed").data("Hoàn tất với cảnh báo."));
            emitter.complete();
            return;
          }
        }

        List<AgentAction> plannedActions = planActions(workspaceId, userId, prompt);
        if (plannedActions.isEmpty()) {
          emitter.send(SseEmitter.event().name("chunk").data("Tôi đã tiếp nhận yêu cầu: \"" + prompt + "\". Hệ thống sẵn sàng hỗ trợ bạn."));
          emitter.complete();
          return;
        }

        int step = 1;
        for (AgentAction action : plannedActions) {
          AgentToolContract tool = toolRegistry.get(action.toolName());
          if (tool != null) {
            emitter.send(SseEmitter.event().name("thought").data("Step " + step + ": Đang thực thi công cụ " + tool.getName() + "..."));
            ToolExecutionResult result = tool.execute(action.argumentsJson());
            emitter.send(SseEmitter.event().name("observation").data("Kết quả " + tool.getName() + ": " + result.output()));
            step++;
          }
        }

        emitter.send(SseEmitter.event().name("completed").data("Đã hoàn thành tất cả các bước xử lý Agentic."));
        emitter.complete();
      } catch (Exception e) {
        try {
          emitter.send(SseEmitter.event().name("chunk").data("\n\n⚠️ **[Lỗi hệ thống]**: " + e.getMessage()));
          emitter.complete();
        } catch (Exception ignored) {}
      } finally {
        com.assistant.kernel.context.WorkspaceContextHolder.clear();
      }
    });
  }

  public void streamUserPrompt(UUID workspaceId, UUID userId, String prompt, SseEmitter emitter) {
    streamUserPrompt(workspaceId, userId, prompt, null, null, null, null, emitter);
  }

  public AgentExecutionResult approveAndExecuteTool(
      UUID workspaceId, UUID userId, String toolName, String argumentsJson) {
    List<AgentTurn> turns = new ArrayList<>();
    AgentToolContract tool = toolRegistry.get(toolName);

    if (tool == null) {
      return AgentExecutionResult.completed(
          "Lỗi: Không tìm thấy công cụ phê duyệt (" + toolName + ").", turns);
    }

    ToolExecutionResult result = tool.execute(argumentsJson);
    turns.add(
        new AgentTurn(
            1,
            new AgentThought("Thực thi công cụ sau khi được phê duyệt: " + toolName),
            new AgentAction(toolName, argumentsJson),
            result.output(),
            false,
            null));

    return AgentExecutionResult.completed(
        "Đã phê duyệt và thực thi thành công thao tác " + toolName + ".", turns);
  }

  private List<AgentAction> planActions(UUID workspaceId, UUID userId, String prompt) {
    List<AgentAction> actions = new ArrayList<>();
    String lower = prompt.toLowerCase(Locale.ROOT);

    if (lower.contains("note") || lower.contains("ghi chú")) {
      String title = "Ghi chú từ Agent";
      String content = prompt;
      String args =
          String.format(
              "{\"workspaceId\":\"%s\",\"userId\":\"%s\",\"title\":\"%s\",\"content\":\"%s\"}",
              workspaceId, userId, title, content);
      actions.add(new AgentAction("create_note", args));
    } else if (lower.contains("task") || lower.contains("nhiệm vụ")) {
      String title = "Nhiệm vụ từ Agent: " + prompt;
      String args =
          String.format(
              "{\"workspaceId\":\"%s\",\"userId\":\"%s\",\"title\":\"%s\"}",
              workspaceId, userId, title);
      actions.add(new AgentAction("create_task", args));
    } else if (lower.contains("lịch") || lower.contains("họp") || lower.contains("nhắc")) {
      String title = "Cuộc họp từ Agent: " + prompt;
      String start = "2026-09-16T09:00:00Z";
      String end = "2026-09-16T10:00:00Z";
      String args =
          String.format(
              "{\"workspaceId\":\"%s\",\"title\":\"%s\",\"startTime\":\"%s\",\"endTime\":\"%s\"}",
              workspaceId, title, start, end);
      actions.add(new AgentAction("create_event", args));
    }

    return actions;
  }

  private String objectMapperEscape(String raw) {
    return "\"" + raw.replace("\"", "\\\"") + "\"";
  }
}
