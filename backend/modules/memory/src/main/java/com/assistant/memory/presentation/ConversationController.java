package com.assistant.memory.presentation;

import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.application.dto.AppendTurnCommand;
import com.assistant.memory.application.dto.TurnDTO;
import com.assistant.memory.application.service.MemoryApplicationService;
import com.assistant.memory.domain.model.Conversation;
import com.assistant.memory.domain.model.ConversationId;
import com.assistant.memory.domain.model.SenderRole;
import com.assistant.memory.presentation.dto.AppendTurnRequest;
import com.assistant.memory.presentation.dto.ConversationSummaryResponse;
import com.assistant.memory.presentation.dto.ConversationTurnResponse;
import com.assistant.memory.presentation.dto.StartConversationRequest;
import com.assistant.workspace.presentation.SecurityUtils;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/conversations")
public class ConversationController {

  private final MemoryApplicationService memoryService;

  public ConversationController(MemoryApplicationService memoryService) {
    this.memoryService = memoryService;
  }

  private void validateWorkspace(UUID pathWorkspaceId) {
    UUID authenticatedWorkspaceId = WorkspaceContextHolder.getRequired().value();
    if (!authenticatedWorkspaceId.equals(pathWorkspaceId)) {
      throw new AccessDeniedException("Access denied. You do not have access to this workspace.");
    }
  }

  @PostMapping
  public ResponseEntity<ConversationSummaryResponse> startConversation(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestBody(required = false) StartConversationRequest request) {
    validateWorkspace(workspaceId);
    UserId userId = SecurityUtils.getCurrentUserId();
    UUID sessionId = request != null ? request.sessionId() : null;

    Conversation conversation =
        memoryService.startConversation(
            new WorkspaceId(workspaceId), userId, sessionId, "New Conversation");

    ConversationSummaryResponse response = toSummaryResponse(conversation);
    return ResponseEntity.created(
            URI.create(
                "/api/v1/workspaces/"
                    + workspaceId
                    + "/conversations/"
                    + conversation.getId().value()))
        .body(response);
  }

  @GetMapping
  public ResponseEntity<Map<String, Object>> listConversations(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "20") int size) {
    validateWorkspace(workspaceId);

    int offset = page * size;
    List<Conversation> conversations =
        memoryService.listConversations(new WorkspaceId(workspaceId), offset, size);
    long totalElements = memoryService.countConversations(new WorkspaceId(workspaceId));
    long totalPages = size > 0 ? (totalElements + size - 1) / size : 1;

    List<ConversationSummaryResponse> data =
        conversations.stream().map(this::toSummaryResponse).collect(Collectors.toList());

    Map<String, Object> response = new HashMap<>();
    response.put("data", data);

    Map<String, Object> meta = new HashMap<>();
    meta.put("page", page);
    meta.put("size", size);
    meta.put("totalElements", totalElements);
    meta.put("totalPages", totalPages);
    response.put("meta", meta);

    return ResponseEntity.ok(response);
  }

  @GetMapping("/{conversationId}/turns")
  public ResponseEntity<List<ConversationTurnResponse>> getRecentTurns(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("conversationId") UUID conversationId,
      @RequestParam(name = "limit", defaultValue = "50") int limit) {
    validateWorkspace(workspaceId);

    List<TurnDTO> turns =
        memoryService.getRecentTurns(
            new WorkspaceId(workspaceId), new ConversationId(conversationId), limit);

    List<ConversationTurnResponse> response =
        turns.stream()
            .map(t -> new ConversationTurnResponse(t.id(), t.role(), t.content(), t.timestamp()))
            .collect(Collectors.toList());

    return ResponseEntity.ok(response);
  }

  @PostMapping("/{conversationId}/turns")
  public ResponseEntity<Void> appendTurn(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("conversationId") UUID conversationId,
      @Valid @RequestBody AppendTurnRequest request) {
    validateWorkspace(workspaceId);

    AppendTurnCommand command =
        new AppendTurnCommand(
            new WorkspaceId(workspaceId),
            new ConversationId(conversationId),
            SenderRole.valueOf(request.senderRole()),
            request.messageContent());

    memoryService.appendMessage(command);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{conversationId}/clear")
  public ResponseEntity<Void> clearConversation(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("conversationId") UUID conversationId) {
    validateWorkspace(workspaceId);

    memoryService.clearHistory(new WorkspaceId(workspaceId), new ConversationId(conversationId));
    return ResponseEntity.noContent().build();
  }

  private ConversationSummaryResponse toSummaryResponse(Conversation conv) {
    return new ConversationSummaryResponse(
        conv.getId().value(),
        conv.getWorkspaceId().value(),
        conv.getTitle(),
        conv.getLastTurnTimestamp(),
        conv.getStatus().name());
  }
}
