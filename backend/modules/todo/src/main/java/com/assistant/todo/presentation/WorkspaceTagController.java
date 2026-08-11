package com.assistant.todo.presentation;

import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.application.port.in.WorkspaceTagPort;
import com.assistant.todo.presentation.dto.CreateWorkspaceTagRequest;
import com.assistant.todo.presentation.dto.UpdateWorkspaceTagRequest;
import com.assistant.todo.presentation.dto.WorkspaceTagResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/tags")
public class WorkspaceTagController {

  private final WorkspaceTagPort tagPort;

  public WorkspaceTagController(WorkspaceTagPort tagPort) {
    this.tagPort = tagPort;
  }

  private void validateWorkspace(UUID pathWorkspaceId) {
    UUID authenticatedWorkspaceId = WorkspaceContextHolder.getRequired().value();
    if (!authenticatedWorkspaceId.equals(pathWorkspaceId)) {
      throw new AccessDeniedException("Access denied. You do not have access to this workspace.");
    }
  }

  @GetMapping
  public ResponseEntity<List<WorkspaceTagResponse>> listTags(
      @PathVariable("workspaceId") UUID workspaceId) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    List<WorkspaceTagResponse> tags =
        tagPort.listTags(wsId).stream()
            .map(WorkspaceTagResponse::fromDomain)
            .collect(Collectors.toList());
    return ResponseEntity.ok(tags);
  }

  @PostMapping
  public ResponseEntity<WorkspaceTagResponse> createTag(
      @PathVariable("workspaceId") UUID workspaceId,
      @Valid @RequestBody CreateWorkspaceTagRequest request) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    WorkspaceTagResponse tag =
        WorkspaceTagResponse.fromDomain(tagPort.createTag(wsId, request.name(), request.color()));
    return ResponseEntity.created(
            URI.create("/api/v1/workspaces/" + workspaceId + "/tags/" + tag.tagId()))
        .body(tag);
  }

  @PutMapping("/{tagId}")
  public ResponseEntity<WorkspaceTagResponse> updateTag(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("tagId") UUID tagId,
      @Valid @RequestBody UpdateWorkspaceTagRequest request) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    WorkspaceTagResponse tag =
        WorkspaceTagResponse.fromDomain(
            tagPort.updateTag(tagId, wsId, request.name(), request.color()));
    return ResponseEntity.ok(tag);
  }

  @DeleteMapping("/{tagId}")
  public ResponseEntity<Void> deleteTag(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("tagId") UUID tagId) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    tagPort.deleteTag(tagId, wsId);
    return ResponseEntity.noContent().build();
  }
}
