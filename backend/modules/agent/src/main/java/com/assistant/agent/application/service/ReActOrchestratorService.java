package com.assistant.agent.application.service;

import com.assistant.agent.domain.llm.LlmPort;
import com.assistant.agent.domain.model.AgentAction;
import com.assistant.agent.domain.model.AgentExecutionResult;
import com.assistant.agent.domain.model.AgentThought;
import com.assistant.agent.domain.model.AgentTurn;
import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.nlp.VietnameseDateTimeParser;
import com.assistant.agent.domain.tool.AgentToolContract;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
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
  private final com.assistant.agent.domain.memory.ConversationMemoryPort memoryStore;
  private final com.assistant.memory.application.ports.in.ConversationHistoryPort
      conversationHistoryPort;
  private final com.assistant.memory.domain.repository.NoteRepository noteRepository;
  private final UserAiConfigService userAiConfigService;

  @org.springframework.beans.factory.annotation.Autowired
  public ReActOrchestratorService(
      List<AgentToolContract> toolContracts,
      LlmPort llmPort,
      com.assistant.agent.domain.memory.ConversationMemoryPort memoryStore,
      com.assistant.memory.application.ports.in.ConversationHistoryPort conversationHistoryPort,
      com.assistant.memory.domain.repository.NoteRepository noteRepository,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
          UserAiConfigService userAiConfigService) {
    this.toolList = toolContracts;
    this.toolRegistry =
        toolContracts.stream()
            .collect(Collectors.toMap(AgentToolContract::getName, Function.identity()));
    this.llmPort = llmPort;
    this.memoryStore = memoryStore;
    this.conversationHistoryPort = conversationHistoryPort;
    this.noteRepository = noteRepository;
    this.userAiConfigService = userAiConfigService;
  }

  public ReActOrchestratorService(
      List<AgentToolContract> toolContracts,
      LlmPort llmPort,
      com.assistant.agent.domain.memory.ConversationMemoryPort memoryStore,
      com.assistant.memory.application.ports.in.ConversationHistoryPort conversationHistoryPort,
      com.assistant.memory.domain.repository.NoteRepository noteRepository) {
    this(toolContracts, llmPort, memoryStore, conversationHistoryPort, noteRepository, null);
  }

  public AgentExecutionResult processUserPrompt(
      UUID workspaceId,
      UUID userId,
      String prompt,
      List<UUID> noteIds,
      String provider,
      String apiKey,
      String baseUrl,
      String model) {
    List<AgentTurn> turns = new ArrayList<>();
    String lowerPrompt = prompt.toLowerCase(Locale.ROOT);

    String augmentedPrompt = prompt;
    if (noteIds != null && !noteIds.isEmpty()) {
      StringBuilder noteContext =
          new StringBuilder("\n\n[Dữ liệu ghi chú được đính kèm (@Note)]:\n");
      for (UUID noteId : noteIds) {
        noteContext.append("- ID Note: ").append(noteId.toString()).append("\n");
      }
      augmentedPrompt += noteContext.toString();
    }

    // Safety interception for destructive actions
    if (lowerPrompt.contains("xóa") || lowerPrompt.contains("delete")) {
      String toolName =
          lowerPrompt.contains("lịch") || lowerPrompt.contains("event")
              ? "delete_events"
              : "delete_tasks";
      String approvalReason = "Thao tác xóa dữ liệu cần sự xác nhận của người dùng.";
      String argsJson =
          String.format("{\"workspaceId\":\"%s\",\"target\":\"%s\"}", workspaceId, prompt);

      AgentTurn pendingTurn =
          new AgentTurn(
              1,
              new AgentThought(
                  "Phát hiện thao tác nguy hiểm ("
                      + toolName
                      + "), tạm dừng để xin phê duyệt từ người dùng."),
              new AgentAction(toolName, argsJson),
              "Chờ xác nhận của người dùng.",
              true,
              approvalReason);
      turns.add(pendingTurn);

      return AgentExecutionResult.requiresApproval(turns, approvalReason, toolName, argsJson);
    }

    String effApiKey = apiKey;
    String effProvider = provider;
    String effBaseUrl = baseUrl;
    String effModel = model;

    if ((effApiKey == null || effApiKey.isBlank()) && userAiConfigService != null) {
      var saved = userAiConfigService.getDecryptedConfig(workspaceId, userId);
      if (saved.apiKey() != null && !saved.apiKey().isBlank()) {
        effApiKey = saved.apiKey();
        effProvider = saved.provider();
        effBaseUrl = saved.baseUrl();
        effModel = saved.model();
      }
    }

    boolean hasCustomLlmConfig =
        (effApiKey != null && !effApiKey.isBlank())
            || (effBaseUrl != null && !effBaseUrl.isBlank());

    if (hasCustomLlmConfig) {
      ZonedDateTime nowLocal = ZonedDateTime.now(VietnameseDateTimeParser.VIETNAM_ZONE);
      String systemPrompt = buildSystemPrompt(nowLocal, prompt);

      LlmPort.LlmResponse llmResp =
          llmPort.callLlm(effBaseUrl, effApiKey, effModel, systemPrompt, augmentedPrompt, toolList);

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
                    new AgentThought(
                        "LLM ("
                            + (effProvider != null ? effProvider : "LLM")
                            + ") thực thi công cụ: "
                            + tc.name()),
                    new AgentAction(tc.name(), tc.argumentsJson()),
                    execRes.output(),
                    false,
                    null));
            resultSummary.append("- ").append(execRes.output()).append("\n");
          }
        }

        return AgentExecutionResult.completed(
            "Phản hồi từ "
                + (effProvider != null ? effProvider : "LLM")
                + ":\n"
                + resultSummary.toString(),
            turns);
      } else if (llmResp.content() != null && !llmResp.content().isBlank()) {
        if (llmResp.content().startsWith("Invocation Error")
            || llmResp.content().startsWith("LLM Error")) {
          return AgentExecutionResult.completed(
              "⚠️ **[Lỗi kết nối AI ("
                  + (effProvider != null ? effProvider : "LLM")
                  + ")]**: "
                  + llmResp.content()
                  + "\n\n"
                  + "*Gợi ý:* Vui lòng kiểm tra lại API Key và cấu hình trong mục **Settings > AI"
                  + " Provider & Vault**.",
              turns);
        }
        return AgentExecutionResult.completed(llmResp.content(), turns);
      }
    }

    // Fallback: Rule-based ReAct cognitive engine with Vietnamese DateTime NLP
    List<AgentAction> plannedActions = planActions(workspaceId, userId, augmentedPrompt);
    int step = 1;
    for (AgentAction action : plannedActions) {
      if (step > MAX_TURNS) {
        break;
      }

      AgentToolContract tool = toolRegistry.get(action.toolName());
      if (tool == null) {
        continue;
      }

      AgentThought thought =
          new AgentThought("Sử dụng công cụ " + tool.getName() + " để thực hiện yêu cầu.");
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

  public AgentExecutionResult processUserPrompt(
      UUID workspaceId,
      UUID userId,
      String prompt,
      String provider,
      String apiKey,
      String baseUrl,
      String model) {
    return processUserPrompt(workspaceId, userId, prompt, null, provider, apiKey, baseUrl, model);
  }

  public AgentExecutionResult processUserPrompt(UUID workspaceId, UUID userId, String prompt) {
    return processUserPrompt(workspaceId, userId, prompt, null, null, null, null, null);
  }

  public void streamUserPrompt(
      UUID workspaceId,
      UUID conversationId,
      UUID userId,
      String prompt,
      List<UUID> noteIds,
      String provider,
      String apiKey,
      String baseUrl,
      String model,
      SseEmitter emitter) {
    com.assistant.kernel.domain.WorkspaceId activeWsId =
        new com.assistant.kernel.domain.WorkspaceId(workspaceId);

    UUID targetMemoryId = conversationId != null ? conversationId : workspaceId;

    CompletableFuture.runAsync(
        () -> {
          try {
            com.assistant.kernel.context.WorkspaceContextHolder.set(activeWsId);

            String lowerPrompt = prompt.toLowerCase(Locale.ROOT);

            if (lowerPrompt.contains("xóa") || lowerPrompt.contains("delete")) {
              String toolName =
                  lowerPrompt.contains("lịch") || lowerPrompt.contains("event")
                      ? "delete_events"
                      : "delete_tasks";
              String approvalReason = "Thao tác xóa dữ liệu cần sự xác nhận của người dùng.";
              String argsJson =
                  String.format("{\"workspaceId\":\"%s\",\"target\":\"%s\"}", workspaceId, prompt);

              emitter.send(
                  SseEmitter.event()
                      .name("approval")
                      .data(
                          String.format(
                              "{\"pendingApproval\":true,\"toolName\":\"%s\",\"reason\":\"%s\",\"argumentsJson\":%s}",
                              toolName, approvalReason, objectMapperEscape(argsJson))));
              emitter.complete();
              return;
            }

            String augmentedPrompt = prompt;
            if (noteIds != null && !noteIds.isEmpty()) {
              StringBuilder noteContext =
                  new StringBuilder("\n\n[Dữ liệu ghi chú được đính kèm (@Note)]:\n");
              for (UUID noteId : noteIds) {
                try {
                  var noteOpt =
                      noteRepository.findById(
                          activeWsId, new com.assistant.memory.domain.model.NoteId(noteId));
                  if (noteOpt.isPresent()) {
                    var note = noteOpt.get();
                    noteContext
                        .append("--- Ghi chú: \"")
                        .append(note.getTitle())
                        .append("\" (ID: ")
                        .append(note.getId().value())
                        .append(") ---\n");
                    noteContext
                        .append(note.getContent() != null ? note.getContent() : "")
                        .append("\n\n");
                  } else {
                    noteContext.append("- ID Note: ").append(noteId.toString()).append("\n");
                  }
                } catch (Exception e) {
                  noteContext.append("- ID Note: ").append(noteId.toString()).append("\n");
                }
              }
              augmentedPrompt += noteContext.toString();
            }

            String effApiKey = apiKey;
            String effProvider = provider;
            String effBaseUrl = baseUrl;
            String effModel = model;

            if ((effApiKey == null || effApiKey.isBlank()) && userAiConfigService != null) {
              var saved = userAiConfigService.getDecryptedConfig(workspaceId, userId);
              if (saved.apiKey() != null && !saved.apiKey().isBlank()) {
                effApiKey = saved.apiKey();
                effProvider = saved.provider();
                effBaseUrl = saved.baseUrl();
                effModel = saved.model();
              }
            }

            boolean hasCustomLlmConfig =
                (effApiKey != null && !effApiKey.isBlank())
                    || (effBaseUrl != null && !effBaseUrl.isBlank());

            if (conversationId != null && memoryStore.getMessages(targetMemoryId).isEmpty()) {
              try {
                var existingTurns =
                    conversationHistoryPort.getRecentTurns(
                        activeWsId,
                        new com.assistant.memory.domain.model.ConversationId(conversationId),
                        20);
                for (var t : existingTurns) {
                  String roleStr =
                      ("user".equalsIgnoreCase(t.role()) || "User".equalsIgnoreCase(t.role()))
                          ? "user"
                          : "assistant";
                  memoryStore.addMessage(targetMemoryId, roleStr, t.content());
                }
              } catch (Exception ignored) {
              }
            }

            memoryStore.addMessage(targetMemoryId, "user", prompt);
            if (conversationId != null) {
              try {
                conversationHistoryPort.appendMessage(
                    new com.assistant.memory.application.dto.AppendTurnCommand(
                        activeWsId,
                        new com.assistant.memory.domain.model.ConversationId(conversationId),
                        com.assistant.memory.domain.model.SenderRole.User,
                        prompt));
              } catch (Exception ignored) {
              }
            }
            List<Map<String, String>> history =
                memoryStore.getLlmFormattedHistory(targetMemoryId, 10);

            if (hasCustomLlmConfig) {
              emitter.send(
                  SseEmitter.event()
                      .name("thought")
                      .data(
                          "Đang kết nối tới "
                              + (effProvider != null ? effProvider : "Local Ollama")
                              + " ("
                              + (effModel != null ? effModel : "default")
                              + ")..."));

              ZonedDateTime nowLocal = ZonedDateTime.now(VietnameseDateTimeParser.VIETNAM_ZONE);
              String systemPrompt = buildSystemPrompt(nowLocal, prompt);

              StringBuilder accumulativeContext = new StringBuilder(augmentedPrompt);
              StringBuilder finalExecutionSummary = new StringBuilder();
              String finalAnswerText = null;
              boolean streamTokensEmitted = false;

              Set<String> executedActionSignatures = new HashSet<>();
              for (int turn = 1; turn <= MAX_TURNS; turn++) {
                final int currentTurn = turn;
                // For the last turn or final answer, stream tokens directly to SSE emitter
                LlmPort.LlmResponse llmResp =
                    llmPort.streamLlm(
                        effBaseUrl,
                        effApiKey,
                        effModel,
                        systemPrompt,
                        accumulativeContext.toString(),
                        history,
                        toolList,
                        chunk -> {
                          try {
                            emitter.send(SseEmitter.event().name("chunk").data(chunk));
                          } catch (Exception ignored) {
                          }
                        });

                if (llmResp.toolCalls() != null && !llmResp.toolCalls().isEmpty()) {
                  StringBuilder turnLogs = new StringBuilder();
                  boolean hasNewAction = false;

                  for (LlmPort.ToolCall tc : llmResp.toolCalls()) {
                    if (toolRegistry.containsKey(tc.name())) {
                      String sig = tc.name() + ":" + tc.argumentsJson().replaceAll("\\s+", "");
                      if (executedActionSignatures.contains(sig)) {
                        continue;
                      }
                      executedActionSignatures.add(sig);
                      hasNewAction = true;

                      AgentToolContract tool = toolRegistry.get(tc.name());
                      emitter.send(
                          SseEmitter.event()
                              .name("thought")
                              .data(
                                  "Bước "
                                      + currentTurn
                                      + ": LLM thực thi công cụ "
                                      + tool.getName()));
                      ToolExecutionResult execRes;
                      try {
                        execRes = tool.execute(tc.argumentsJson());
                      } catch (Exception ex) {
                        execRes =
                            ToolExecutionResult.error(
                                "Lỗi khi chạy công cụ " + tool.getName() + ": " + ex.getMessage());
                      }

                      emitter.send(
                          SseEmitter.event()
                              .name("observation")
                              .data("Kết quả (" + tool.getName() + "): " + execRes.output()));
                      turnLogs
                          .append("Tool ")
                          .append(tool.getName())
                          .append(" returned: ")
                          .append(execRes.output())
                          .append("\n");
                    }
                  }

                  if (!hasNewAction) {
                    // All requested tool calls were duplicate / already executed
                    break;
                  }

                  finalExecutionSummary.append(turnLogs);
                  accumulativeContext
                      .append("\n\n[Kết quả thực thi công cụ ở Bước ")
                      .append(turn)
                      .append("]:\n")
                      .append(turnLogs);
                  accumulativeContext.append(
                      "\n"
                          + "[LƯU Ý]: Các công cụ trên ĐÃ THỰC THI THÀNH CÔNG VÀ ĐÃ ĐƯỢC LƯU VÀO HỆ"
                          + " THỐNG. KHÔNG ĐƯỢC GỌI LẠI CÔNG CỤ TRÙNG LẶP. Hãy trả lời câu hỏi của"
                          + " người dùng và tóm tắt kết quả thân thiện bằng tiếng Việt.");
                } else if (llmResp.content() != null && !llmResp.content().isBlank()) {
                  streamTokensEmitted = true;
                  if (llmResp.content().startsWith("Invocation Error")
                      || llmResp.content().startsWith("LLM Error")) {
                    finalAnswerText =
                        "⚠️ **[Lỗi kết nối AI ("
                            + (effProvider != null ? effProvider : "LLM")
                            + ")]**: "
                            + llmResp.content()
                            + "\n\n"
                            + "*Gợi ý:* Vui lòng kiểm tra lại API Key và cấu hình trong mục"
                            + " **Settings > AI Provider & Vault**.";
                  } else {
                    finalAnswerText = llmResp.content();
                  }
                  break;
                } else {
                  break;
                }
              }

              if (finalAnswerText == null || finalAnswerText.isBlank()) {
                finalAnswerText =
                    finalExecutionSummary.length() > 0
                        ? "Đã hoàn thành các thao tác trên hệ thống:\n\n"
                            + finalExecutionSummary.toString()
                        : "Hệ thống đã tiếp nhận yêu cầu của bạn.";
                if (!streamTokensEmitted) {
                  emitter.send(SseEmitter.event().name("chunk").data(finalAnswerText));
                }
              }

              memoryStore.addMessage(targetMemoryId, "assistant", finalAnswerText);
              if (conversationId != null) {
                try {
                  conversationHistoryPort.appendMessage(
                      new com.assistant.memory.application.dto.AppendTurnCommand(
                          activeWsId,
                          new com.assistant.memory.domain.model.ConversationId(conversationId),
                          com.assistant.memory.domain.model.SenderRole.Agent,
                          finalAnswerText));
                } catch (Exception ignored) {
                }
              }

              emitter.send(SseEmitter.event().name("completed").data("Hoàn tất."));
              emitter.complete();
              return;
            }

            // Fall through to planActions rule-based engine if no custom LLM config
            List<AgentAction> plannedActions = planActions(workspaceId, userId, augmentedPrompt);
            if (plannedActions.isEmpty()) {
              String fallbackReply =
                  "Tôi đã tiếp nhận yêu cầu: \"" + prompt + "\". Hệ thống sẵn sàng hỗ trợ bạn.";
              memoryStore.addMessage(targetMemoryId, "assistant", fallbackReply);
              emitter.send(SseEmitter.event().name("chunk").data(fallbackReply));
              emitter.complete();
              return;
            }

            int step = 1;
            StringBuilder resultSummary = new StringBuilder();
            for (AgentAction action : plannedActions) {
              AgentToolContract tool = toolRegistry.get(action.toolName());
              if (tool != null) {
                emitter.send(
                    SseEmitter.event()
                        .name("thought")
                        .data(
                            "Step " + step + ": Đang thực thi công cụ " + tool.getName() + "..."));
                ToolExecutionResult result = tool.execute(action.argumentsJson());
                emitter.send(
                    SseEmitter.event()
                        .name("observation")
                        .data("Kết quả " + tool.getName() + ": " + result.output()));
                resultSummary.append(result.output()).append("\n");
                step++;
              }
            }

            String summaryAnswer =
                "Đã hoàn thành các yêu cầu của bạn:\n" + resultSummary.toString().trim();
            memoryStore.addMessage(targetMemoryId, "assistant", summaryAnswer);
            emitter.send(SseEmitter.event().name("chunk").data(summaryAnswer));
            emitter.send(
                SseEmitter.event()
                    .name("completed")
                    .data("Đã hoàn thành tất cả các bước xử lý Agentic."));
            emitter.complete();
          } catch (Exception e) {
            try {
              emitter.send(
                  SseEmitter.event()
                      .name("chunk")
                      .data("\n\n⚠️ **[Lỗi hệ thống]**: " + e.getMessage()));
              emitter.complete();
            } catch (Exception ignored) {
            }
          } finally {
            com.assistant.kernel.context.WorkspaceContextHolder.clear();
          }
        });
  }

  public void streamUserPrompt(UUID workspaceId, UUID userId, String prompt, SseEmitter emitter) {
    streamUserPrompt(workspaceId, null, userId, prompt, null, null, null, null, null, emitter);
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

  private String buildSystemPrompt(ZonedDateTime nowLocal, String userPrompt) {
    String currentLocalTimeStr =
        nowLocal.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss (EEEE, 'múi giờ' z)"));

    var parsedNlp = VietnameseDateTimeParser.parse(userPrompt, nowLocal);
    String nlpHint = "";
    if (parsedNlp.hasExplicitDate() || parsedNlp.hasExplicitTime()) {
      nlpHint =
          "\n[VIETNAMESE NLP PRE-PARSED TIME HINT]:"
              + "\n- StartTime (ISO-8601): "
              + parsedNlp.startTime().toInstant().toString()
              + "\n- EndTime (ISO-8601): "
              + parsedNlp.endTime().toInstant().toString()
              + "\n- Cleaned Topic: "
              + parsedNlp.cleanedTitle()
              + "\n"
              + "(Use these accurate ISO timestamps when calling `upsert_events` or"
              + " `upsert_tasks`)";
    }

    return "You are Kyros AI Executive Assistant, an intelligent, professional AI capable of"
        + " orchestrating schedules, tasks, and notes.\n"
        + "Current Local Time: "
        + currentLocalTimeStr
        + nlpHint
        + "\n"
        + "Always convert event timestamps into local Vietnam time (UTC+7 / Asia/Ho_Chi_Minh) when"
        + " responding.\n"
        + "FORMATTING GUIDELINES:\n"
        + "- Always respond with clean, beautifully formatted, professional Markdown in natural"
        + " Vietnamese.\n"
        + "- Do NOT insert extra spaces between letters, words, or markdown asterisks (e.g., write"
        + " **Hôm nay** NOT ** Hôm nay **).\n"
        + "- Use bold headers, bullet lists, emojis (📅, ⏰, 🎯, ✅), and clear spacing for"
        + " readability.\n"
        + "AVAILABLE MUTATION & QUERY TOOLS:\n"
        + "- upsert_events: Create or update calendar events. Parameters: {\"workspaceId\":\"...\","
        + " \"events\": [{\"title\":\"...\", \"description\":\"...\", \"startTime\":\"ISO-8601\","
        + " \"endTime\":\"ISO-8601\"}]}\n"
        + "- upsert_tasks: Create or update tasks. Parameters: {\"workspaceId\":\"...\", \"tasks\":"
        + " [{\"title\":\"...\", \"description\":\"...\", \"dueDate\":\"ISO-8601\"}]}\n"
        + "- list_events, list_tasks, list_notes, delete_events, delete_tasks.\n"
        + "CRITICAL INSTRUCTION: When the user asks to schedule, plan, or create calendar events or"
        + " tasks (e.g. 'lên lịch', 'họp', 'tạo task', 'chuẩn bị slide'), YOU MUST CALL"
        + " `upsert_events` OR `upsert_tasks` TOOLS directly to persist them into the system. Do"
        + " NOT just output text schedules without calling tools.";
  }

  private List<AgentAction> planActions(UUID workspaceId, UUID userId, String prompt) {
    List<AgentAction> actions = new ArrayList<>();
    String lower = prompt.toLowerCase(Locale.ROOT);

    boolean isQuery =
        lower.contains("có")
            || lower.contains("xem")
            || lower.contains("tra cứu")
            || lower.contains("lấy")
            || lower.contains("gì")
            || lower.contains("danh sách")
            || lower.contains("báo cáo");

    if (isQuery) {
      if (lower.contains("lịch") || lower.contains("họp") || lower.contains("sự kiện")) {
        actions.add(
            new AgentAction("list_events", String.format("{\"workspaceId\":\"%s\"}", workspaceId)));
      }
      if (lower.contains("task") || lower.contains("nhiệm vụ") || lower.contains("công việc")) {
        actions.add(
            new AgentAction("list_tasks", String.format("{\"workspaceId\":\"%s\"}", workspaceId)));
      }
      if (lower.contains("note") || lower.contains("ghi chú")) {
        actions.add(
            new AgentAction("list_notes", String.format("{\"workspaceId\":\"%s\"}", workspaceId)));
      }
      if (!actions.isEmpty()) {
        return actions;
      }
    }

    // Check for note creation
    if ((lower.contains("note") || lower.contains("ghi chú"))
        && (lower.contains("tạo") || lower.contains("thêm") || lower.contains("lưu"))) {
      String title = "Ghi chú từ Agent";
      String content = prompt;
      String args =
          String.format(
              "{\"workspaceId\":\"%s\",\"userId\":\"%s\",\"title\":\"%s\",\"content\":\"%s\"}",
              workspaceId, userId, title, content);
      actions.add(new AgentAction("create_note", args));
    }

    // Check for multi-tool (both task & event) or event/task individually
    boolean hasEventIntent =
        lower.contains("lịch")
            || lower.contains("họp")
            || lower.contains("hẹn")
            || lower.contains("meeting")
            || lower.contains("chiều nay")
            || lower.contains("sáng nay")
            || lower.contains("ngày mai")
            || lower.contains("sáng mai")
            || lower.contains("chiều mai")
            || lower.contains("tối mai");

    boolean hasTaskIntent =
        lower.contains("task")
            || lower.contains("nhiệm vụ")
            || lower.contains("công việc")
            || lower.contains("chuẩn bị")
            || lower.contains("làm slide")
            || lower.contains("viết báo cáo")
            || (lower.contains("tạo") && !hasEventIntent);

    var parsedNlp = VietnameseDateTimeParser.parse(prompt);

    if (hasEventIntent) {
      String eventTitle = parsedNlp.cleanedTitle();
      if (eventTitle.isEmpty() || eventTitle.length() < 3) {
        eventTitle = prompt;
      }
      String start = parsedNlp.startTime().toInstant().toString();
      String end = parsedNlp.endTime().toInstant().toString();

      String args =
          String.format(
              "{\"workspaceId\":\"%s\",\"events\":[{\"title\":\"%s\",\"startTime\":\"%s\",\"endTime\":\"%s\"}]}",
              workspaceId, eventTitle, start, end);
      actions.add(new AgentAction("upsert_events", args));
    }

    if (hasTaskIntent) {
      String taskTitle =
          prompt
              .replaceAll("(?i)^(thêm|tạo|cho tôi|nhiệm vụ|task|giúp tôi|hãy)\\s*", "")
              .replaceAll("(?i)(và lên lịch.*|đặt lịch.*|họp.*)$", "")
              .trim();
      if (taskTitle.isEmpty()) {
        taskTitle = prompt;
      }
      String due = parsedNlp.startTime().toInstant().toString();
      String args =
          String.format(
              "{\"workspaceId\":\"%s\",\"userId\":\"%s\",\"tasks\":[{\"title\":\"%s\",\"dueDate\":\"%s\"}]}",
              workspaceId, userId, taskTitle, due);
      actions.add(new AgentAction("upsert_tasks", args));
    }

    return actions;
  }

  private String objectMapperEscape(String raw) {
    return "\"" + raw.replace("\"", "\\\"") + "\"";
  }
}
