package com.assistant.agent.presentation;

import com.assistant.agent.application.service.ReActOrchestratorService;
import com.assistant.agent.domain.model.AgentExecutionResult;
import com.assistant.agent.presentation.dto.AgentApproveRequest;
import com.assistant.agent.presentation.dto.AgentChatRequest;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/agent")
public class AgentChatController {

  private final ReActOrchestratorService orchestratorService;
  private final com.assistant.agent.infrastructure.memory.ConversationMemoryStore memoryStore;
  private final com.assistant.memory.application.ports.in.ConversationHistoryPort conversationHistoryPort;

  public AgentChatController(
      ReActOrchestratorService orchestratorService,
      com.assistant.agent.infrastructure.memory.ConversationMemoryStore memoryStore,
      com.assistant.memory.application.ports.in.ConversationHistoryPort conversationHistoryPort) {
    this.orchestratorService = orchestratorService;
    this.memoryStore = memoryStore;
    this.conversationHistoryPort = conversationHistoryPort;
  }

  @GetMapping("/history")
  public ResponseEntity<java.util.List<com.assistant.agent.infrastructure.memory.ConversationMemoryStore.ChatMessageDto>> getHistory(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestParam(name = "conversationId", required = false) UUID conversationId) {
    UUID targetId = conversationId != null ? conversationId : workspaceId;
    var inMemoryMessages = memoryStore.getMessages(targetId);
    if (!inMemoryMessages.isEmpty() || conversationId == null) {
      return ResponseEntity.ok(inMemoryMessages);
    }

    // Persistent fallback: query database turns from memory module
    try {
      var dbTurns = conversationHistoryPort.getRecentTurns(
          new com.assistant.kernel.domain.WorkspaceId(workspaceId),
          new com.assistant.memory.domain.model.ConversationId(conversationId),
          50);
      java.util.List<com.assistant.agent.infrastructure.memory.ConversationMemoryStore.ChatMessageDto> fallbackList =
          dbTurns.stream()
              .map(t -> new com.assistant.agent.infrastructure.memory.ConversationMemoryStore.ChatMessageDto(
                  t.role().toLowerCase(),
                  t.content(),
                  t.timestamp() != null ? t.timestamp().toEpochMilli() : System.currentTimeMillis()))
              .collect(java.util.stream.Collectors.toList());
      return ResponseEntity.ok(fallbackList);
    } catch (Exception e) {
      return ResponseEntity.ok(java.util.Collections.emptyList());
    }
  }

  @PostMapping("/chat")
  public ResponseEntity<AgentExecutionResult> processChat(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestBody AgentChatRequest request,
      @RequestHeader(name = "X-AI-Api-Key", required = false) String headerApiKey,
      @RequestHeader(name = "X-AI-Provider", required = false) String headerProvider,
      @RequestHeader(name = "X-AI-Base-Url", required = false) String headerBaseUrl,
      @RequestHeader(name = "X-AI-Model", required = false) String headerModel) {
    UUID userId = request.userId() != null ? request.userId() : UUID.randomUUID();
    String apiKey = (headerApiKey != null && !headerApiKey.isBlank()) ? headerApiKey : request.apiKey();
    String provider = (headerProvider != null && !headerProvider.isBlank()) ? headerProvider : request.provider();
    String baseUrl = (headerBaseUrl != null && !headerBaseUrl.isBlank()) ? headerBaseUrl : request.baseUrl();
    String model = (headerModel != null && !headerModel.isBlank()) ? headerModel : request.model();

    AgentExecutionResult result =
        orchestratorService.processUserPrompt(
            workspaceId, userId, request.prompt(), request.noteIds(), provider, apiKey, baseUrl, model);
    return ResponseEntity.ok(result);
  }

  @GetMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter streamChat(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestParam("prompt") String prompt,
      @RequestParam(name = "noteIds", required = false) java.util.List<UUID> noteIds,
      @RequestParam(name = "conversationId", required = false) UUID conversationId,
      @RequestParam(name = "userId", required = false) UUID userId,
      @RequestHeader(name = "X-AI-Api-Key", required = false) String apiKey,
      @RequestHeader(name = "X-AI-Provider", required = false) String provider,
      @RequestHeader(name = "X-AI-Base-Url", required = false) String baseUrl,
      @RequestHeader(name = "X-AI-Model", required = false) String model) {
    SseEmitter emitter = new SseEmitter(120_000L);
    UUID finalUserId = userId != null ? userId : UUID.randomUUID();
    orchestratorService.streamUserPrompt(
        workspaceId, conversationId, finalUserId, prompt, noteIds, provider, apiKey, baseUrl, model, emitter);
    return emitter;
  }

  @PostMapping("/approve")
  public ResponseEntity<AgentExecutionResult> approveAction(
      @PathVariable("workspaceId") UUID workspaceId, @RequestBody AgentApproveRequest request) {
    UUID userId = request.userId() != null ? request.userId() : UUID.randomUUID();
    AgentExecutionResult result =
        orchestratorService.approveAndExecuteTool(
            workspaceId, userId, request.toolName(), request.argumentsJson());
    return ResponseEntity.ok(result);
  }
}
