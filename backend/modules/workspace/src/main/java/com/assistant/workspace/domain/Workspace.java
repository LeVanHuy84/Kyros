package com.assistant.workspace.domain;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class Workspace {

  private final WorkspaceId id;
  private String name;
  private WorkspaceStatus status;
  private UserId ownerId;
  private final Instant createdAt;
  private Instant updatedAt;
  private int version;
  private final List<Membership> memberships;

  public Workspace(
      WorkspaceId id,
      String name,
      WorkspaceStatus status,
      UserId ownerId,
      Instant createdAt,
      Instant updatedAt,
      int version,
      List<Membership> memberships) {
    this.id = Objects.requireNonNull(id, "id cannot be null");
    setName(name);
    this.status = Objects.requireNonNull(status, "status cannot be null");
    this.ownerId = Objects.requireNonNull(ownerId, "ownerId cannot be null");
    this.createdAt = Objects.requireNonNull(createdAt, "createdAt cannot be null");
    this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt cannot be null");
    this.version = version;
    this.memberships =
        new ArrayList<>(Objects.requireNonNull(memberships, "memberships cannot be null"));
  }

  public Workspace(WorkspaceId id, String name, UserId ownerId) {
    this(
        id,
        name,
        WorkspaceStatus.Active,
        ownerId,
        Instant.now(),
        Instant.now(),
        0,
        new ArrayList<>());
    // Owner is automatically a member
    addMembership(ownerId, WorkspaceRole.Owner, false);
  }

  public WorkspaceId getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    if (name == null || name.trim().isEmpty()) {
      throw new IllegalArgumentException("Workspace name cannot be empty");
    }
    this.name = name.trim();
    this.updatedAt = Instant.now();
  }

  public WorkspaceStatus getStatus() {
    return status;
  }

  public void setStatus(WorkspaceStatus status) {
    this.status = Objects.requireNonNull(status, "status cannot be null");
    this.updatedAt = Instant.now();
  }

  public UserId getOwnerId() {
    return ownerId;
  }

  public void changeOwner(UserId newOwnerId) {
    this.ownerId = Objects.requireNonNull(newOwnerId, "newOwnerId cannot be null");
    this.updatedAt = Instant.now();

    // Ensure the new owner is a member with Owner role
    boolean found = false;
    for (Membership m : memberships) {
      if (m.getUserId().equals(newOwnerId)) {
        m.changeRole(WorkspaceRole.Owner);
        found = true;
      } else if (m.getRole() == WorkspaceRole.Owner) {
        // Demote previous owner to Admin or Member? Let's demote to Admin or Member
        m.changeRole(WorkspaceRole.Admin);
      }
    }
    if (!found) {
      addMembership(newOwnerId, WorkspaceRole.Owner, false);
    }
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public int getVersion() {
    return version;
  }

  public List<Membership> getMemberships() {
    return Collections.unmodifiableList(memberships);
  }

  public void addMembership(UserId userId, WorkspaceRole role, boolean isPrimary) {
    Objects.requireNonNull(userId, "userId cannot be null");
    Objects.requireNonNull(role, "role cannot be null");

    boolean alreadyMember = memberships.stream().anyMatch(m -> m.getUserId().equals(userId));
    if (alreadyMember) {
      throw new IllegalStateException("User is already a member of this workspace");
    }

    Membership membership = new Membership(id, userId, role, isPrimary);
    memberships.add(membership);
    this.updatedAt = Instant.now();
  }

  public void removeMembership(UserId userId) {
    Objects.requireNonNull(userId, "userId cannot be null");
    if (userId.equals(ownerId)) {
      throw new IllegalStateException("Cannot remove the owner from the workspace");
    }
    boolean removed = memberships.removeIf(m -> m.getUserId().equals(userId));
    if (removed) {
      this.updatedAt = Instant.now();
    }
  }
}
