package com.assistant.workspace.domain;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public class Membership {

  private final UUID id;
  private final WorkspaceId workspaceId;
  private final UserId userId;
  private WorkspaceRole role;
  private boolean isPrimary;
  private final Instant createdAt;
  private Instant updatedAt;

  public Membership(
      UUID id,
      WorkspaceId workspaceId,
      UserId userId,
      WorkspaceRole role,
      boolean isPrimary,
      Instant createdAt,
      Instant updatedAt) {
    this.id = Objects.requireNonNull(id, "id cannot be null");
    this.workspaceId = Objects.requireNonNull(workspaceId, "workspaceId cannot be null");
    this.userId = Objects.requireNonNull(userId, "userId cannot be null");
    this.role = Objects.requireNonNull(role, "role cannot be null");
    this.isPrimary = isPrimary;
    this.createdAt = Objects.requireNonNull(createdAt, "createdAt cannot be null");
    this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt cannot be null");
  }

  public Membership(WorkspaceId workspaceId, UserId userId, WorkspaceRole role, boolean isPrimary) {
    this(UUID.randomUUID(), workspaceId, userId, role, isPrimary, Instant.now(), Instant.now());
  }

  public UUID getId() {
    return id;
  }

  public WorkspaceId getWorkspaceId() {
    return workspaceId;
  }

  public UserId getUserId() {
    return userId;
  }

  public WorkspaceRole getRole() {
    return role;
  }

  public boolean isPrimary() {
    return isPrimary;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void changeRole(WorkspaceRole newRole) {
    this.role = Objects.requireNonNull(newRole, "newRole cannot be null");
    this.updatedAt = Instant.now();
  }

  public void setPrimary(boolean isPrimary) {
    this.isPrimary = isPrimary;
    this.updatedAt = Instant.now();
  }
}
