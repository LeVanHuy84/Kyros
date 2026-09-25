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
          AgentRulePlanner rulePlanner) {
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
    String augmentedPrompt = contextAugmenter.augmentWithNotes(prompt, noteIds, activeWsId);

    // 1. Safety Guard Evaluation
    var safetyResult = safetyGuard.evaluatePrompt(workspaceId, prompt, locale);
    if (safetyResult.isDestructive()) {
      return safetyGuard.createApprovalResult(safetyResult);
    }

    // 2. Custom LLM Execution Loop
    EffectiveAiConfig config =
        resolveEffectiveConfig(workspaceId, userId, provider, apiKey, baseUrl, model);
    if (config.hasCustomConfig()) {
      AgentExecutionResult llmResult = executeLlmOrchestration(augmentedPrompt, config, locale);
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

            // 1. Safety Guard
            var safetyResult = safetyGuard.evaluatePrompt(workspaceId, prompt, callerLocale);
            if (safetyResult.isDestructive()) {
              emitter.send(
                  SseEmitter.event()
                      .name("approval")
                      .data(
                          String.format(
                              "{\"pendingApproval\":true,\"toolName\":\"%s\",\"reason\":\"%s\",\"argumentsJson\":%s}",
                              safetyResult.toolName(),
                              safetyResult.approvalReason(),
                              objectMapperEscape(safetyResult.argumentsJson()))));
              emitter.complete();
              return;
            }

            String augmentedPrompt = contextAugmenter.augmentWithNotes(prompt, noteIds, activeWsId);
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
            try {
              emitter.send(
                  SseEmitter.event()
                      .name("chunk")
                      .data("\n\n⚠️ **[System Error]**: " + e.getMessage()));
              emitter.complete();
            } catch (Exception ignored) {
            }
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
      String augmentedPrompt, EffectiveAiConfig config, Locale locale) {
    List<AgentTurn> turns = new ArrayList<>();
    ZonedDateTime nowLocal = ZonedDateTime.now(NaturalDateTimeParser.DEFAULT_ZONE);
    String systemPrompt = promptBuilder.buildSystemPrompt(nowLocal, augmentedPrompt);

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
    emitter.send(SseEmitter.event().name("thought").data(connMsg));

    ZonedDateTime nowLocal = ZonedDateTime.now(NaturalDateTimeParser.DEFAULT_ZONE);
    String systemPrompt = promptBuilder.buildSystemPrompt(nowLocal, originalPrompt);

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

            emitter.send(
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
        emitter.send(SseEmitter.event().name("chunk").data(finalAnswerText));
      }
    }

    persistFinalAnswer(activeWsId, targetMemoryId, conversationId, finalAnswerText);
    emitter.send(
        SseEmitter.event()
            .name("completed")
            .data(msg("agent.status.completed", null, "Completed.", locale)));
    emitter.complete();
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
                    msg(
                        "agent.thought.step_executing_tool",
                        new Object[] {step, tool.getName()},
                        "Step " + step + ": Executing tool " + tool.getName() + "...",
                        locale)));
        ToolExecutionResult result = tool.execute(action.argumentsJson());
        emitter.send(
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
        msg(
            "agent.fallback.completed_operations",
            new Object[] {resultSummary.toString().trim()},
            "Completed your requests:\n" + resultSummary.toString().trim(),
            locale);
    persistFinalAnswer(activeWsId, targetMemoryId, conversationId, summaryAnswer);
    emitter.send(SseEmitter.event().name("chunk").data(summaryAnswer));
    emitter.send(
        SseEmitter.event()
            .name("completed")
            .data(
                msg(
                    "agent.status.completed",
                    null,
                    "Completed all agentic processing steps.",
                    locale)));
    emitter.complete();
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

  private record EffectiveAiConfig(String provider, String apiKey, String baseUrl, String model) {
    public boolean hasCustomConfig() {
      return (apiKey != null && !apiKey.isBlank()) || (baseUrl != null && !baseUrl.isBlank());
    }

    public String displayName() {
      return provider != null && !provider.isBlank() ? provider : "LLM";
    }
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
