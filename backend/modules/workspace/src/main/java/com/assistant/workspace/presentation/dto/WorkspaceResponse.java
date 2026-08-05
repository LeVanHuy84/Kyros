package com.assistant.workspace.presentation.dto;

import com.assistant.workspace.domain.Workspace;
import java.time.Instant;
import java.util.UUID;

public record WorkspaceResponse(
    UUID id, String name, String status, UUID ownerId, Instant createdAt, Instant updatedAt) {

  public static WorkspaceResponse fromDomain(Workspace workspace) {
    return new WorkspaceResponse(
        workspace.getId().value(),
        workspace.getName(),
        workspace.getStatus().name(),
        workspace.getOwnerId().value(),
        workspace.getCreatedAt(),
        workspace.getUpdatedAt());
  }
}
