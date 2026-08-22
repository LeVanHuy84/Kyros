package com.assistant.memory.presentation;

import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.application.service.MemoryApplicationService;
import com.assistant.memory.domain.model.MemoryEntry;
import com.assistant.memory.domain.model.MemoryId;
import com.assistant.memory.presentation.dto.CreateOrUpdateMemoryEntryRequest;
import com.assistant.memory.presentation.dto.MemoryEntryResponse;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/memory-entries")
public class MemoryEntryController {

  private final MemoryApplicationService memoryService;

  public MemoryEntryController(MemoryApplicationService memoryService) {
    this.memoryService = memoryService;
  }

  private void validateWorkspace(UUID pathWorkspaceId) {
    UUID authenticatedWorkspaceId = WorkspaceContextHolder.getRequired().value();
    if (!authenticatedWorkspaceId.equals(pathWorkspaceId)) {
      throw new AccessDeniedException("Access denied. You do not have access to this workspace.");
    }
  }

  @PostMapping
  public ResponseEntity<MemoryEntryResponse> createMemoryEntry(
      @PathVariable("workspaceId") UUID workspaceId,
      @Valid @RequestBody CreateOrUpdateMemoryEntryRequest request) {
    validateWorkspace(workspaceId);
    UserId userId = SecurityUtils.getCurrentUserId();
    float confidence = request.confidenceScore() != null ? request.confidenceScore() : 1.0f;

    MemoryEntry entry =
        memoryService.createMemoryEntry(
            new WorkspaceId(workspaceId), userId, request.content(), confidence);

    return ResponseEntity.created(
            URI.create(
                "/api/v1/workspaces/" + workspaceId + "/memory-entries/" + entry.getId().value()))
        .body(toResponse(entry));
  }

  @GetMapping
  public ResponseEntity<Map<String, Object>> listOrSearchMemoryEntries(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestParam(name = "query", required = false) String query,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "20") int size) {
    validateWorkspace(workspaceId);
    UserId userId = SecurityUtils.getCurrentUserId();

    List<MemoryEntryResponse> data;
    long totalElements;

    if (query != null && !query.trim().isEmpty()) {
      data =
          memoryService.searchSemanticFacts(new WorkspaceId(workspaceId), query.trim()).stream()
              .map(
                  dto ->
                      new MemoryEntryResponse(
                          dto.id(),
                          dto.workspaceId(),
                          dto.content(),
                          dto.confidenceScore(),
                          dto.createdAt(),
                          dto.updatedAt()))
              .collect(Collectors.toList());
      totalElements = data.size();
    } else {
      int offset = page * size;
      List<MemoryEntry> entries =
          memoryService.listMemoryEntries(new WorkspaceId(workspaceId), userId, offset, size);
      data = entries.stream().map(this::toResponse).collect(Collectors.toList());
      totalElements = memoryService.countMemoryEntries(new WorkspaceId(workspaceId), userId);
    }

    long totalPages = size > 0 ? (totalElements + size - 1) / size : 1;

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

  @GetMapping("/{memoryId}")
  public ResponseEntity<MemoryEntryResponse> getMemoryEntry(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("memoryId") UUID memoryId) {
    validateWorkspace(workspaceId);

    MemoryEntry entry =
        memoryService
            .getMemoryEntry(new MemoryId(memoryId), new WorkspaceId(workspaceId))
            .orElseThrow(
                () ->
                    new com.assistant.kernel.exception.EntityNotFoundException(
                        "Memory entry not found"));

    return ResponseEntity.ok(toResponse(entry));
  }

  @PutMapping("/{memoryId}")
  public ResponseEntity<MemoryEntryResponse> updateMemoryEntry(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("memoryId") UUID memoryId,
      @Valid @RequestBody CreateOrUpdateMemoryEntryRequest request) {
    validateWorkspace(workspaceId);
    float confidence = request.confidenceScore() != null ? request.confidenceScore() : 1.0f;

    MemoryEntry entry =
        memoryService.reviseMemoryEntry(
            new MemoryId(memoryId), new WorkspaceId(workspaceId), request.content(), confidence);

    return ResponseEntity.ok(toResponse(entry));
  }

  @DeleteMapping("/{memoryId}")
  public ResponseEntity<Void> deleteMemoryEntry(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("memoryId") UUID memoryId) {
    validateWorkspace(workspaceId);

    memoryService.deleteMemoryEntry(new MemoryId(memoryId), new WorkspaceId(workspaceId));
    return ResponseEntity.noContent().build();
  }

  private MemoryEntryResponse toResponse(MemoryEntry entry) {
    return new MemoryEntryResponse(
        entry.getId().value(),
        entry.getWorkspaceId().value(),
        entry.getContent(),
        entry.getConfidenceScore(),
        entry.getCreatedAt(),
        entry.getUpdatedAt());
  }
}
