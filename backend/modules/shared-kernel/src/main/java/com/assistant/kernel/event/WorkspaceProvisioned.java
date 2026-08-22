package com.assistant.kernel.event;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.Objects;

public record WorkspaceProvisioned(WorkspaceId workspaceId, UserId ownerId, Instant occurredAt)
    implements DomainEvent {

  public WorkspaceProvisioned {
    Objects.requireNonNull(workspaceId, "Workspace ID cannot be null");
    Objects.requireNonNull(ownerId, "Owner ID cannot be null");
    Objects.requireNonNull(occurredAt, "Occurred timestamp cannot be null");
  }

  public WorkspaceProvisioned(WorkspaceId workspaceId, UserId ownerId) {
    this(workspaceId, ownerId, Instant.now());
  }
}
