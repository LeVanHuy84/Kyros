package com.assistant.todo.presentation.dto;

import com.assistant.todo.domain.model.WorkspaceTag;
import java.time.Instant;
import java.util.UUID;

public record WorkspaceTagResponse(
    UUID tagId, UUID workspaceId, String name, String color, Instant createdAt) {

  public static WorkspaceTagResponse fromDomain(WorkspaceTag tag) {
    return new WorkspaceTagResponse(
        tag.getId(),
        tag.getWorkspaceId().value(),
        tag.getName(),
        tag.getColor(),
        tag.getCreatedAt());
  }
}
