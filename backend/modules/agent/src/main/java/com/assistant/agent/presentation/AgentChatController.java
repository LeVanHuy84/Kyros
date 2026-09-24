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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/agent")
public class AgentChatController {

  private final ReActOrchestratorService orchestratorService;
  private final com.assistant.agent.domain.memory.ConversationMemoryPort memoryStore;
  private final com.assistant.memory.application.ports.in.ConversationHistoryPort
      conversationHistoryPort;

  public AgentChatController(
      ReActOrchestratorService orchestratorService,
      com.assistant.agent.domain.memory.ConversationMemoryPort memoryStore,
      com.assistant.memory.application.ports.in.ConversationHistoryPort conversationHistoryPort) {
    this.orchestratorService = orchestratorService;
    this.memoryStore = memoryStore;
    this.conversationHistoryPort = conversationHistoryPort;
  }

  private UUID resolveUserId(UUID fallback) {
    return fallback != null ? fallback : UUID.fromString("00000000-0000-0000-0000-000000000001");
  }

  @GetMapping("/history")
  public ResponseEntity<
          java.util.List<com.assistant.agent.domain.memory.ConversationMemoryPort.ChatMessageDto>>
      getHistory(
          @PathVariable("workspaceId") UUID workspaceId,
          @RequestParam(name = "conversationId", required = false) UUID conversationId) {
    UUID targetId = conversationId != null ? conversationId : workspaceId;
    var inMemoryMessages = memoryStore.getMessages(targetId);
    if (!inMemoryMessages.isEmpty() || conversationId == null) {
      return ResponseEntity.ok(inMemoryMessages);
    }

    // Persistent fallback: query database turns from memory module
    try {
      var dbTurns =
          conversationHistoryPort.getRecentTurns(
              new com.assistant.kernel.domain.WorkspaceId(workspaceId),
              new com.assistant.memory.domain.model.ConversationId(conversationId),
              50);
      java.util.List<com.assistant.agent.domain.memory.ConversationMemoryPort.ChatMessageDto>
          fallbackList =
              dbTurns.stream()
                  .map(
                      t ->
                          new com.assistant.agent.domain.memory.ConversationMemoryPort
                              .ChatMessageDto(
                              t.role().toLowerCase(java.util.Locale.ROOT),
                              t.content(),
                              t.timestamp() != null
                                  ? t.timestamp().toEpochMilli()
                                  : System.currentTimeMillis()))
                  .collect(java.util.stream.Collectors.toList());
      return ResponseEntity.ok(fallbackList);
    } catch (Exception e) {
      return ResponseEntity.ok(java.util.Collections.emptyList());
    }
  }

  @PostMapping("/chat")
  public ResponseEntity<AgentExecutionResult> processChat(
      @PathVariable("workspaceId") UUID workspaceId, @RequestBody AgentChatRequest request) {
    UUID userId = resolveUserId(request.userId());

    AgentExecutionResult result =
        orchestratorService.processUserPrompt(
            workspaceId,
            userId,
            request.prompt(),
            request.noteIds(),
            request.provider(),
            request.apiKey(),
            request.baseUrl(),
            request.model());
    return ResponseEntity.ok(result);
  }

  @GetMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter streamChat(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestParam("prompt") String prompt,
      @RequestParam(name = "noteIds", required = false) java.util.List<UUID> noteIds,
      @RequestParam(name = "conversationId", required = false) UUID conversationId,
      @RequestParam(name = "userId", required = false) UUID userId) {
    SseEmitter emitter = new SseEmitter(120_000L);
    UUID finalUserId = resolveUserId(userId);
    orchestratorService.streamUserPrompt(
        workspaceId, conversationId, finalUserId, prompt, noteIds, null, null, null, null, emitter);
    return emitter;
  }

  @PostMapping("/approve")
  public ResponseEntity<AgentExecutionResult> approveAction(
      @PathVariable("workspaceId") UUID workspaceId, @RequestBody AgentApproveRequest request) {
    UUID userId = resolveUserId(request.userId());
    AgentExecutionResult result =
        orchestratorService.approveAndExecuteTool(
            workspaceId, userId, request.toolName(), request.argumentsJson());
    return ResponseEntity.ok(result);
  }
}
