package com.assistant.todo.domain.model;

import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.UUID;

public class WorkspaceTag {

  private final UUID id;
  private final WorkspaceId workspaceId;
  private String name;
  private String color; // optional hex color, e.g. "#6366f1"
  private final Instant createdAt;

  public WorkspaceTag(
      UUID id, WorkspaceId workspaceId, String name, String color, Instant createdAt) {
    this.id = id;
    this.workspaceId = workspaceId;
    this.name = name;
    this.color = color;
    this.createdAt = createdAt;
  }

  /** Factory method for new tag creation. */
  public static WorkspaceTag create(WorkspaceId workspaceId, String name, String color) {
    return new WorkspaceTag(UUID.randomUUID(), workspaceId, name, color, Instant.now());
  }

  public UUID getId() {
    return id;
  }

  public WorkspaceId getWorkspaceId() {
    return workspaceId;
  }

  public String getName() {
    return name;
  }

  public String getColor() {
    return color;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void rename(String newName) {
    if (newName == null || newName.isBlank()) {
      throw new IllegalArgumentException("Tag name must not be blank");
    }
    this.name = newName.trim();
  }

  public void recolor(String newColor) {
    this.color = newColor;
  }
}
