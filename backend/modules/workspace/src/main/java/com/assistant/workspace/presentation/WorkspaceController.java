package com.assistant.workspace.presentation;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.exception.EntityNotFoundException;
import com.assistant.workspace.application.ports.in.WorkspacePort;
import com.assistant.workspace.domain.Workspace;
import com.assistant.workspace.presentation.dto.CreateWorkspaceRequest;
import com.assistant.workspace.presentation.dto.WorkspaceResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

  private final WorkspacePort workspacePort;

  public WorkspaceController(WorkspacePort workspacePort) {
    this.workspacePort = workspacePort;
  }

  @PostMapping
  public ResponseEntity<WorkspaceResponse> createWorkspace(
      @Valid @RequestBody CreateWorkspaceRequest request) {
    UserId currentUserId = SecurityUtils.getCurrentUserId();
    Workspace workspace = workspacePort.createWorkspace(request.name(), currentUserId);
    return ResponseEntity.status(HttpStatus.CREATED).body(WorkspaceResponse.fromDomain(workspace));
  }

  @GetMapping
  public ResponseEntity<List<WorkspaceResponse>> getUserWorkspaces() {
    UserId currentUserId = SecurityUtils.getCurrentUserId();
    List<Workspace> workspaces = workspacePort.getUserWorkspaces(currentUserId);
    List<WorkspaceResponse> responses =
        workspaces.stream().map(WorkspaceResponse::fromDomain).collect(Collectors.toList());
    return ResponseEntity.ok(responses);
  }

  @GetMapping("/primary")
  public ResponseEntity<WorkspaceResponse> getPrimaryWorkspace() {
    UserId currentUserId = SecurityUtils.getCurrentUserId();
    Workspace workspace =
        workspacePort
            .getPrimaryWorkspace(currentUserId)
            .orElseThrow(
                () ->
                    new EntityNotFoundException(
                        "Primary workspace not found for user: " + currentUserId));
    return ResponseEntity.ok(WorkspaceResponse.fromDomain(workspace));
  }

  @PostMapping("/primary/{workspaceId}")
  public ResponseEntity<Void> setPrimaryWorkspace(@PathVariable("workspaceId") UUID workspaceId) {
    UserId currentUserId = SecurityUtils.getCurrentUserId();
    workspacePort.setPrimaryWorkspace(new WorkspaceId(workspaceId), currentUserId);
    return ResponseEntity.noContent().build();
  }
}
