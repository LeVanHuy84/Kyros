package com.assistant.agent.application.service;

import com.assistant.agent.domain.llm.LlmPort;
import com.assistant.agent.domain.memory.ConversationMemoryPort;
import com.assistant.agent.domain.model.AgentAction;
import com.assistant.agent.domain.model.AgentExecutionResult;
import com.assistant.agent.domain.model.AgentThought;
import com.assistant.agent.domain.model.AgentTurn;
import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.nlp.NaturalDateTimeParser;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.application.dto.AppendTurnCommand;
import com.assistant.memory.application.ports.in.ConversationHistoryPort;
import com.assistant.memory.domain.model.ConversationId;
import com.assistant.memory.domain.model.SenderRole;
import com.assistant.memory.domain.repository.NoteRepository;
import java.time.ZonedDateTime;
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
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * ReAct Orchestration Service that coordinates safety checks, context augmentation, LLM execution
 * loops, tool calling, and fallback cognitive planning.
 */
@Service
public class ReActOrchestratorService {

  private static final int MAX_TURNS = 5;

  private final Map<String, AgentToolContract> toolRegistry;
  private final List<AgentToolContract> toolList;
  private final LlmPort llmPort;
  private final ConversationMemoryPort memoryStore;
  private final ConversationHistoryPort conversationHistoryPort;
  private final UserAiConfigService userAiConfigService;
  private final MessageSource messageSource;
  private final AgentSafetyGuard safetyGuard;
  private final AgentSystemPromptBuilder promptBuilder;
  private final AgentContextAugmenter contextAugmenter;
  private final AgentRulePlanner rulePlanner;
  private final com.assistant.memory.application.ports.in.CoreProfilePort coreProfilePort;

  @org.springframework.beans.factory.annotation.Autowired
  public ReActOrchestratorService(
      List<AgentToolContract> toolContracts,
      LlmPort llmPort,
      ConversationMemoryPort memoryStore,
      ConversationHistoryPort conversationHistoryPort,
      NoteRepository noteRepository,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
          UserAiConfigService userAiConfigService,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
          MessageSource messageSource,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
          AgentSafetyGuard safetyGuard,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
          AgentSystemPromptBuilder promptBuilder,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
          AgentContextAugmenter contextAugmenter,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
          AgentRulePlanner rulePlanner,
      @org.springframework.beans.factory.annotation.Autowired(required = false)
          com.assistant.memory.application.ports.in.CoreProfilePort coreProfilePort) {
    this.toolList = toolContracts != null ? toolContracts : List.of();
    this.toolRegistry =
        this.toolList.stream()
            .collect(Collectors.toMap(AgentToolContract::getName, Function.identity()));
    this.llmPort = llmPort;
    this.memoryStore = memoryStore;
    this.conversationHistoryPort = conversationHistoryPort;
    this.userAiConfigService = userAiConfigService;
    this.messageSource = messageSource;
    this.safetyGuard = safetyGuard != null ? safetyGuard : new AgentSafetyGuard(messageSource);
    this.promptBuilder = promptBuilder != null ? promptBuilder : new AgentSystemPromptBuilder();
    this.contextAugmenter =
        contextAugmenter != null ? contextAugmenter : new AgentContextAugmenter(noteRepository);
    this.rulePlanner = rulePlanner != null ? rulePlanner : new AgentRulePlanner(messageSource);
    this.coreProfilePort = coreProfilePort;
  }

  public ReActOrchestratorService(
      List<AgentToolContract> toolContracts,
      LlmPort llmPort,
      ConversationMemoryPort memoryStore,
      ConversationHistoryPort conversationHistoryPort,
      NoteRepository noteRepository,
      UserAiConfigService userAiConfigService) {
    this(
        toolContracts,
        llmPort,
        memoryStore,
        conversationHistoryPort,
        noteRepository,
        userAiConfigService,
        null,
        null,
        null,
        null,
        null,
        null);
  }

  public ReActOrchestratorService(
      List<AgentToolContract> toolContracts,
      LlmPort llmPort,
      ConversationMemoryPort memoryStore,
      ConversationHistoryPort conversationHistoryPort,
      NoteRepository noteRepository) {
    this(
        toolContracts,
        llmPort,
        memoryStore,
        conversationHistoryPort,
        noteRepository,
        null,
        null,
        null,
        null,
        null,
        null,
        null);
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
    Locale locale = LocaleContextHolder.getLocale();
    WorkspaceId activeWsId = new WorkspaceId(workspaceId);

    // 0. Slash Commands (Help Cheatsheet)
    String trimmed = prompt != null ? prompt.trim() : "";
    if (trimmed.equalsIgnoreCase("/help")
        || trimmed.equals("/?")
        || trimmed.equalsIgnoreCase("/commands")) {
      return AgentExecutionResult.completed(getSlashHelpMessage(locale), List.of());
    }

    String augmentedPrompt = contextAugmenter.augmentPrompt(prompt, noteIds, activeWsId);

    // 1. Safety Guard Evaluation
    var safetyResult = safetyGuard.evaluatePrompt(workspaceId, prompt, locale);
    if (safetyResult.isDestructive()) {
      return safetyGuard.createApprovalResult(safetyResult);
    }

    // 2. Custom LLM Execution Loop (Handles slash commands with high intelligence when LLM key is
    // configured)
    EffectiveAiConfig config =
        resolveEffectiveConfig(workspaceId, userId, provider, apiKey, baseUrl, model);
    if (config.hasCustomConfig()) {
      AgentExecutionResult llmResult =
          executeLlmOrchestration(activeWsId, userId, augmentedPrompt, config, locale);
      if (llmResult != null) {
        return llmResult;
      }
    }

    // 3. Fallback: Rule-based Cognitive Planner
    return executeRuleBasedPlan(workspaceId, userId, augmentedPrompt, prompt, locale);
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
    WorkspaceId activeWsId = new WorkspaceId(workspaceId);
    UUID targetMemoryId = conversationId != null ? conversationId : workspaceId;
    Locale callerLocale = LocaleContextHolder.getLocale();

    CompletableFuture.runAsync(
        () -> {
          try {
            WorkspaceContextHolder.set(activeWsId);
            LocaleContextHolder.setLocale(callerLocale);

            String trimmed = prompt != null ? prompt.trim() : "";

            // 0. Slash Commands (Help Cheatsheet)
            if (trimmed.equalsIgnoreCase("/help")
                || trimmed.equals("/?")
                || trimmed.equalsIgnoreCase("/commands")) {
              String helpText = getSlashHelpMessage(callerLocale);
              persistFinalAnswer(activeWsId, targetMemoryId, conversationId, helpText);
              sendSafe(emitter, SseEmitter.event().name("chunk").data(helpText));
              sendSafe(
                  emitter,
                  SseEmitter.event()
                      .name("completed")
                      .data(msg("agent.status.completed", null, "Completed.", callerLocale)));
              completeSafe(emitter);
              return;
            }

            // 1. Safety Guard
            var safetyResult = safetyGuard.evaluatePrompt(workspaceId, prompt, callerLocale);
            if (safetyResult.isDestructive()) {
              sendSafe(
                  emitter,
                  SseEmitter.event()
                      .name("approval")
                      .data(
                          String.format(
                              "{\"pendingApproval\":true,\"toolName\":\"%s\",\"reason\":\"%s\",\"argumentsJson\":%s}",
                              safetyResult.toolName(),
                              safetyResult.approvalReason(),
                              objectMapperEscape(safetyResult.argumentsJson()))));
              completeSafe(emitter);
              return;
            }

            String augmentedPrompt = contextAugmenter.augmentPrompt(prompt, noteIds, activeWsId);
            EffectiveAiConfig config =
                resolveEffectiveConfig(workspaceId, userId, provider, apiKey, baseUrl, model);

            syncConversationMemory(activeWsId, targetMemoryId, conversationId, prompt);
            List<Map<String, String>> history =
                memoryStore.getLlmFormattedHistory(targetMemoryId, 10);

            if (config.hasCustomConfig()) {
              streamLlmOrchestration(
                  activeWsId,
                  targetMemoryId,
                  conversationId,
                  userId,
                  prompt,
                  augmentedPrompt,
                  history,
                  config,
                  callerLocale,
                  emitter);
              return;
            }
            // Fallback Rule-based execution
            streamRuleBasedPlan(
                activeWsId,
                targetMemoryId,
                conversationId,
                workspaceId,
                userId,
                prompt,
                augmentedPrompt,
                callerLocale,
                emitter);

          } catch (Exception e) {
            sendSafe(
                emitter,
                SseEmitter.event()
                    .name("chunk")
                    .data("\n\n⚠️ **[System Error]**: " + e.getMessage()));
            completeSafe(emitter);
          } finally {
            WorkspaceContextHolder.clear();
            LocaleContextHolder.resetLocaleContext();
          }
        });
  }

  public void streamUserPrompt(UUID workspaceId, UUID userId, String prompt, SseEmitter emitter) {
    streamUserPrompt(workspaceId, null, userId, prompt, null, null, null, null, null, emitter);
  }

  public AgentExecutionResult approveAndExecuteTool(
      UUID workspaceId, UUID userId, String toolName, String argumentsJson) {
    Locale locale = LocaleContextHolder.getLocale();
    List<AgentTurn> turns = new ArrayList<>();
    AgentToolContract tool = toolRegistry.get(toolName);

    if (tool == null) {
      return AgentExecutionResult.completed(
          msg(
              "agent.approval.tool_not_found",
              new Object[] {toolName},
              "Error: Tool not found for approval (" + toolName + ").",
              locale),
          turns);
    }

    ToolExecutionResult result = tool.execute(argumentsJson);
    turns.add(
        new AgentTurn(
            1,
            new AgentThought(
                msg(
                    "agent.thought.executing_tool",
                    new Object[] {toolName},
                    "Executing tool after approval: " + toolName,
                    locale)),
            new AgentAction(toolName, argumentsJson),
            result.output(),
            false,
            null));

    return AgentExecutionResult.completed(
        msg(
            "agent.approval.success",
            new Object[] {toolName},
            "Successfully approved and executed " + toolName + ".",
            locale),
        turns);
  }

  private AgentExecutionResult executeLlmOrchestration(
      WorkspaceId workspaceId,
      UUID userId,
      String augmentedPrompt,
      EffectiveAiConfig config,
      Locale locale) {
    List<AgentTurn> turns = new ArrayList<>();
    ZonedDateTime nowLocal = ZonedDateTime.now(NaturalDateTimeParser.DEFAULT_ZONE);
    String coreProfile =
        coreProfilePort != null && workspaceId != null && userId != null
            ? coreProfilePort.getSynthesizedCoreProfile(
                workspaceId, new com.assistant.kernel.domain.UserId(userId))
            : "";
    String systemPrompt = promptBuilder.buildSystemPrompt(nowLocal, augmentedPrompt, coreProfile);

    LlmPort.LlmResponse llmResp =
        llmPort.callLlm(
            config.baseUrl(),
            config.apiKey(),
            config.model(),
            systemPrompt,
            augmentedPrompt,
            toolList);

    if (llmResp.toolCalls() != null && !llmResp.toolCalls().isEmpty()) {
      StringBuilder resultSummary = new StringBuilder();
      int step = 1;
      for (LlmPort.ToolCall tc : llmResp.toolCalls()) {
        if (safetyGuard.isDestructiveTool(tc.name())) {
          var safetyCheck = safetyGuard.evaluateToolCall(tc.name(), tc.argumentsJson(), locale);
          return safetyGuard.createApprovalResult(safetyCheck);
        }

        if (toolRegistry.containsKey(tc.name())) {
          AgentToolContract tool = toolRegistry.get(tc.name());
          ToolExecutionResult execRes = tool.execute(tc.argumentsJson());

          turns.add(
              new AgentTurn(
                  step++,
                  new AgentThought(
                      "LLM ("
                          + config.displayName()
                          + ") "
                          + msg(
                              "agent.thought.executing_tool",
                              new Object[] {tc.name()},
                              "executing tool: " + tc.name(),
                              locale)),
                  new AgentAction(tc.name(), tc.argumentsJson()),
                  execRes.output(),
                  false,
                  null));
          resultSummary.append("- ").append(execRes.output()).append("\n");
        }
      }

      String prefix =
          msg(
              "agent.llm.response_prefix",
              new Object[] {config.displayName(), resultSummary.toString()},
              "Response from " + config.displayName() + ":\n" + resultSummary.toString(),
              locale);
      return AgentExecutionResult.completed(prefix, turns);
    } else if (llmResp.content() != null && !llmResp.content().isBlank()) {
      if (llmResp.content().startsWith("Invocation Error")
          || llmResp.content().startsWith("LLM Error")) {
        String hint =
            msg(
                "agent.llm.error_hint",
                null,
                "\n\n"
                    + "*Hint:* Please check your API Key and configuration in **Settings > AI"
                    + " Provider & Vault**.",
                locale);
        return AgentExecutionResult.completed(
            "⚠️ **[AI Error (" + config.displayName() + ")]**: " + llmResp.content() + hint, turns);
      }
      return AgentExecutionResult.completed(llmResp.content(), turns);
    }

    return null;
  }

  private void streamLlmOrchestration(
      WorkspaceId activeWsId,
      UUID targetMemoryId,
      UUID conversationId,
      UUID userId,
      String originalPrompt,
      String augmentedPrompt,
      List<Map<String, String>> history,
      EffectiveAiConfig config,
      Locale locale,
      SseEmitter emitter)
      throws Exception {
    String connMsg =
        msg(
            "agent.thought.connecting_llm",
            new Object[] {
              config.displayName(), config.model() != null ? config.model() : "default"
            },
            "Connecting to "
                + config.displayName()
                + " ("
                + (config.model() != null ? config.model() : "default")
                + ")...",
            locale);
    sendSafe(emitter, SseEmitter.event().name("thought").data(connMsg));

    ZonedDateTime nowLocal = ZonedDateTime.now(NaturalDateTimeParser.DEFAULT_ZONE);
    String coreProfile =
        coreProfilePort != null && activeWsId != null && userId != null
            ? coreProfilePort.getSynthesizedCoreProfile(
                activeWsId, new com.assistant.kernel.domain.UserId(userId))
            : "";
    String systemPrompt = promptBuilder.buildSystemPrompt(nowLocal, originalPrompt, coreProfile);

    StringBuilder accumulativeContext = new StringBuilder(augmentedPrompt);
    StringBuilder finalExecutionSummary = new StringBuilder();
    String finalAnswerText = null;
    boolean streamTokensEmitted = false;

    Set<String> executedActionSignatures = new HashSet<>();
    for (int turn = 1; turn <= MAX_TURNS; turn++) {
      final int currentTurn = turn;
      LlmPort.LlmResponse llmResp =
          llmPort.streamLlm(
              config.baseUrl(),
              config.apiKey(),
              config.model(),
              systemPrompt,
              accumulativeContext.toString(),
              history,
              toolList,
              chunk -> {
                sendSafe(emitter, SseEmitter.event().name("chunk").data(chunk));
              });

      if (llmResp.toolCalls() != null && !llmResp.toolCalls().isEmpty()) {
        StringBuilder turnLogs = new StringBuilder();
        boolean hasNewAction = false;

        for (LlmPort.ToolCall tc : llmResp.toolCalls()) {
          if (safetyGuard.isDestructiveTool(tc.name())) {
            var safetyCheck = safetyGuard.evaluateToolCall(tc.name(), tc.argumentsJson(), locale);
            sendSafe(
                emitter,
                SseEmitter.event()
                    .name("approval")
                    .data(
                        String.format(
                            "{\"pendingApproval\":true,\"toolName\":\"%s\",\"reason\":\"%s\",\"argumentsJson\":%s}",
                            safetyCheck.toolName(),
                            safetyCheck.approvalReason(),
                            objectMapperEscape(safetyCheck.argumentsJson()))));
            completeSafe(emitter);
            return;
          }

          if (toolRegistry.containsKey(tc.name())) {
            String sig = tc.name() + ":" + tc.argumentsJson().replaceAll("\\s+", "");
            if (executedActionSignatures.contains(sig)) {
              continue;
            }
            executedActionSignatures.add(sig);
            hasNewAction = true;

            AgentToolContract tool = toolRegistry.get(tc.name());
            sendSafe(
                emitter,
                SseEmitter.event()
                    .name("thought")
                    .data(
                        msg(
                            "agent.thought.step_executing_tool",
                            new Object[] {currentTurn, tool.getName()},
                            "Step " + currentTurn + ": LLM executing tool " + tool.getName(),
                            locale)));
            ToolExecutionResult execRes;
            try {
              execRes = tool.execute(tc.argumentsJson());
            } catch (Exception ex) {
              execRes =
                  ToolExecutionResult.error(
                      msg(
                          "agent.observation.tool_error",
                          new Object[] {tool.getName(), ex.getMessage()},
                          "Error executing tool " + tool.getName() + ": " + ex.getMessage(),
                          locale));
            }

            sendSafe(
                emitter,
                SseEmitter.event()
                    .name("observation")
                    .data(
                        msg(
                            "agent.observation.tool_result",
                            new Object[] {tool.getName(), execRes.output()},
                            "Result (" + tool.getName() + "): " + execRes.output(),
                            locale)));
            turnLogs
                .append("Tool ")
                .append(tool.getName())
                .append(" returned: ")
                .append(execRes.output())
                .append("\n");
          }
        }

        if (!hasNewAction) {
          break;
        }

        finalExecutionSummary.append(turnLogs);
        accumulativeContext
            .append("\n\n[Tool execution output at Step ")
            .append(turn)
            .append("]:\n")
            .append(turnLogs);
        accumulativeContext.append(
            "\n"
                + "[INSTRUCTION]: The tools above succeeded and modified the system. DO NOT call"
                + " duplicate tools. Provide a clean summary in the user's language.");
      } else if (llmResp.content() != null && !llmResp.content().isBlank()) {
        streamTokensEmitted = true;
        if (llmResp.content().startsWith("Invocation Error")
            || llmResp.content().startsWith("LLM Error")) {
          String hint =
              msg(
                  "agent.llm.error_hint",
                  null,
                  "\n\n"
                      + "*Hint:* Please check your API Key and configuration in **Settings > AI"
                      + " Provider & Vault**.",
                  locale);
          finalAnswerText =
              "⚠️ **[AI Error (" + config.displayName() + ")]**: " + llmResp.content() + hint;
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
              ? msg(
                  "agent.fallback.completed_operations",
                  new Object[] {finalExecutionSummary.toString()},
                  "Completed system operations:\n\n" + finalExecutionSummary.toString(),
                  locale)
              : msg(
                  "agent.fallback.received_request",
                  new Object[] {originalPrompt},
                  "The system has received your request.",
                  locale);
      if (!streamTokensEmitted) {
        sendSafe(emitter, SseEmitter.event().name("chunk").data(finalAnswerText));
      }
    }

    persistFinalAnswer(activeWsId, targetMemoryId, conversationId, finalAnswerText);
    sendSafe(
        emitter,
        SseEmitter.event()
            .name("completed")
            .data(msg("agent.status.completed", null, "Completed.", locale)));
    completeSafe(emitter);
  }

  private AgentExecutionResult executeRuleBasedPlan(
      UUID workspaceId, UUID userId, String augmentedPrompt, String prompt, Locale locale) {
    List<AgentAction> plannedActions =
        rulePlanner.planActions(workspaceId, userId, augmentedPrompt, locale);
    List<AgentTurn> turns = new ArrayList<>();
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
          new AgentThought(
              msg(
                  "agent.thought.using_tool",
                  new Object[] {tool.getName()},
                  "Using tool " + tool.getName() + " to process the request.",
                  locale));
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
            ? msg(
                "agent.fallback.received_request",
                new Object[] {prompt},
                "Received request: \"" + prompt + "\". The system is ready to assist you.",
                locale)
            : msg(
                "agent.fallback.steps_summary",
                new Object[] {
                  turns.stream()
                      .map(
                          t ->
                              "- "
                                  + msg(
                                      "agent.thought.step_executing_tool",
                                      new Object[] {t.stepNumber(), t.action().toolName()},
                                      "Step " + t.stepNumber() + ": " + t.observation(),
                                      locale))
                      .collect(Collectors.joining("\n"))
                },
                "Completed agentic processing steps. Details:\n"
                    + turns.stream()
                        .map(t -> "- Step " + t.stepNumber() + ": " + t.observation())
                        .collect(Collectors.joining("\n")),
                locale);

    return AgentExecutionResult.completed(summaryAnswer, turns);
  }

  private void streamRuleBasedPlan(
      WorkspaceId activeWsId,
      UUID targetMemoryId,
      UUID conversationId,
      UUID workspaceId,
      UUID userId,
      String prompt,
      String augmentedPrompt,
      Locale locale,
      SseEmitter emitter)
      throws Exception {
    List<AgentAction> plannedActions =
        rulePlanner.planActions(workspaceId, userId, augmentedPrompt, locale);
    if (plannedActions.isEmpty()) {
      String fallbackReply =
          msg(
              "agent.fallback.received_request",
              new Object[] {prompt},
              "Received request: \"" + prompt + "\". The system is ready to assist you.",
              locale);
      memoryStore.addMessage(targetMemoryId, "assistant", fallbackReply);
      sendSafe(emitter, SseEmitter.event().name("chunk").data(fallbackReply));
      completeSafe(emitter);
      return;
    }

    int step = 1;
    StringBuilder resultSummary = new StringBuilder();
    for (AgentAction action : plannedActions) {
      AgentToolContract tool = toolRegistry.get(action.toolName());
      if (tool != null) {
        sendSafe(
            emitter,
            SseEmitter.event()
                .name("thought")
                .data(
                    msg(
                        "agent.thought.step_executing_tool",
                        new Object[] {step, tool.getName()},
                        "Step " + step + ": Executing tool " + tool.getName() + "...",
                        locale)));
        ToolExecutionResult result = tool.execute(action.argumentsJson());
        sendSafe(
            emitter,
            SseEmitter.event()
                .name("observation")
                .data(
                    msg(
                        "agent.observation.tool_result",
                        new Object[] {tool.getName(), result.output()},
                        "Result (" + tool.getName() + "): " + result.output(),
                        locale)));
        resultSummary.append(result.output()).append("\n");
        step++;
      }
    }

    String summaryAnswer =
        formatFallbackTable(plannedActions, resultSummary.toString().trim(), locale);
    persistFinalAnswer(activeWsId, targetMemoryId, conversationId, summaryAnswer);
    sendSafe(emitter, SseEmitter.event().name("chunk").data(summaryAnswer));
    sendSafe(
        emitter,
        SseEmitter.event()
            .name("completed")
            .data(
                msg(
                    "agent.status.completed",
                    null,
                    "Completed all agentic processing steps.",
                    locale)));
    completeSafe(emitter);
  }

  private String formatFallbackTable(
      List<AgentAction> actions, String resultSummary, Locale locale) {
    boolean isEn = locale != null && "en".equalsIgnoreCase(locale.getLanguage());
    StringBuilder sb = new StringBuilder();
    if (isEn) {
      sb.append("📌 **Kyros AI — Summary of Completed Operations**\n\n");
      sb.append("| Operation | Target Tool | Status |\n");
      sb.append("| :--- | :--- | :--- |\n");
      for (AgentAction a : actions) {
        String opName =
            switch (a.toolName()) {
              case "upsert_events" -> "📅 Calendar Event";
              case "upsert_tasks" -> "🎯 Task / Todo";
              case "upsert_notes" -> "📝 Note";
              case "save_memory" -> "🧠 Memory Vault";
              case "list_events" -> "📅 List Events";
              case "list_tasks" -> "🎯 List Tasks";
              case "list_notes" -> "📝 List Notes";
              case "recall_memory" -> "🔍 Recall Memory";
              default -> a.toolName();
            };
        sb.append("| ")
            .append(opName)
            .append(" | `")
            .append(a.toolName())
            .append("`")
            .append(" | ✅ Success |\n");
      }
      if (!resultSummary.isEmpty()) {
        sb.append("\n**Execution Details:**\n").append(resultSummary);
      }
    } else {
      sb.append("📌 **Kyros AI — Tóm tắt công việc đã thực hiện**\n\n");
      sb.append("| Loại tác vụ | Thao tác | Trạng thái |\n");
      sb.append("| :--- | :--- | :--- |\n");
      for (AgentAction a : actions) {
        String opName =
            switch (a.toolName()) {
              case "upsert_events" -> "📅 Lịch hẹn (Event)";
              case "upsert_tasks" -> "🎯 Nhiệm vụ (Task)";
              case "upsert_notes" -> "📝 Ghi chú (Note)";
              case "save_memory" -> "🧠 Trí nhớ (Vault)";
              case "list_events" -> "📅 Xem sự kiện";
              case "list_tasks" -> "🎯 Xem nhiệm vụ";
              case "list_notes" -> "📝 Xem ghi chú";
              case "recall_memory" -> "🔍 Tra cứu trí nhớ";
              default -> a.toolName();
            };
        sb.append("| ")
            .append(opName)
            .append(" | `")
            .append(a.toolName())
            .append("`")
            .append(" | ✅ Hoàn tất |\n");
      }
      if (!resultSummary.isEmpty()) {
        sb.append("\n**Chi tiết thực thi:**\n").append(resultSummary);
      }
    }
    return sb.toString();
  }

  private void syncConversationMemory(
      WorkspaceId activeWsId, UUID targetMemoryId, UUID conversationId, String prompt) {
    if (conversationId != null && memoryStore.getMessages(targetMemoryId).isEmpty()) {
      try {
        var existingTurns =
            conversationHistoryPort.getRecentTurns(
                activeWsId, new ConversationId(conversationId), 20);
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
            new AppendTurnCommand(
                activeWsId, new ConversationId(conversationId), SenderRole.User, prompt));
      } catch (Exception ignored) {
      }
    }
  }

  private void persistFinalAnswer(
      WorkspaceId activeWsId, UUID targetMemoryId, UUID conversationId, String finalAnswerText) {
    memoryStore.addMessage(targetMemoryId, "assistant", finalAnswerText);
    if (conversationId != null) {
      try {
        conversationHistoryPort.appendMessage(
            new AppendTurnCommand(
                activeWsId, new ConversationId(conversationId), SenderRole.Agent, finalAnswerText));
      } catch (Exception ignored) {
      }
    }
  }

  private EffectiveAiConfig resolveEffectiveConfig(
      UUID workspaceId, UUID userId, String provider, String apiKey, String baseUrl, String model) {
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

    return new EffectiveAiConfig(effProvider, effApiKey, effBaseUrl, effModel);
  }

  private boolean sendSafe(SseEmitter emitter, SseEmitter.SseEventBuilder event) {
    try {
      emitter.send(event);
      return true;
    } catch (Exception e) {
      return false;
    }
  }

  private void completeSafe(SseEmitter emitter) {
    try {
      emitter.complete();
    } catch (Exception ignored) {
    }
  }

  private record EffectiveAiConfig(String provider, String apiKey, String baseUrl, String model) {
    public boolean hasCustomConfig() {
      return (apiKey != null && !apiKey.isBlank()) || (baseUrl != null && !baseUrl.isBlank());
    }

    public String displayName() {
      return provider != null && !provider.isBlank() ? provider : "LLM";
    }
  }

  public String getSlashHelpMessage(Locale locale) {
    boolean isEn = locale != null && "en".equalsIgnoreCase(locale.getLanguage());
    if (isEn) {
      return """
      ### 📋 Slash Commands Cheatsheet

      | Command | Example Syntax | Description |
      | :--- | :--- | :--- |
      | **`/memory <content>`** | `/memory Always address me as Kyros and summarize in tables` | Save user preference or rule to **Memory Vault** |
      | **`/rule <content>`** | `/rule Never schedule meetings on Monday mornings` | Save a fixed working rule to **Memory Vault** |
      | **`/task <title> [due]`** | `/task Finish revenue report 5pm tomorrow` | Create a new task in Todo list |
      | **`/event <title> [time]`** | `/event Sprint Review meeting 2pm Friday` | Schedule an event on Calendar |
      | **`/note <title>: <content>`**| `/note Phase 5 Architecture: Added Slash Commands` | Create a new Note |
      | **`/recall <query>`** | `/recall meeting rules` | Search knowledge & rules in Memory Vault |
      | **`/list <tasks|events|notes>`** | `/list tasks` | Quick view list of tasks, events, or notes |
      | **`/help`** | `/help` | Display this command cheatsheet |

      💡 **Shortcut Tip:** Type `/` in the chat input at any time to open the Command Palette!
      """;
    }
    return """
    ### 📋 Bảng Tra Cứu Lệnh Nhanh (Slash Commands Cheatsheet)

    | Lệnh (Command) | Cú pháp mẫu | Mô tả chức năng |
    | :--- | :--- | :--- |
    | **`/memory <nội dung>`** | `/memory Xưng hô là Kyros, luôn tóm tắt dạng bảng` | Lưu quy tắc / sở thích vào **Memory Vault** |
    | **`/rule <nội dung>`** | `/rule Không nhận lịch họp vào sáng thứ 2` | Thiết lập nguyên tắc làm việc cố định |
    | **`/task <tiêu đề> [thời gian]`** | `/task Hoàn thành slide báo cáo 17:00 ngày mai` | Tạo nhiệm vụ mới (Todo List) |
    | **`/event <tiêu đề> [thời gian]`**| `/event Họp Sprint Review 14:00 thứ 6` | Lên lịch hẹn / cuộc họp (Calendar) |
    | **`/note <tiêu đề>: <nội dung>`** | `/note Kiến trúc Phase 5: Thêm Slash Commands` | Tạo ghi chú mới |
    | **`/recall <từ khóa>`** | `/recall quy tắc họp` | Tìm kiếm trí nhớ trong Memory Vault |
    | **`/list <tasks|events|notes>`** | `/list tasks` | Liệt kê danh sách tác vụ nhanh |
    | **`/help`** | `/help` | Hiển thị bảng hướng dẫn lệnh này |

    💡 **Mẹo phím tắt:** Bạn có thể gõ ký tự `/` bất kỳ lúc nào để mở Menu gợi ý lệnh nhanh!
    """;
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

  private String objectMapperEscape(String raw) {
    return "\"" + raw.replace("\"", "\\\"") + "\"";
  }
}
