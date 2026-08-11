package com.assistant.todo.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workspace_tags", schema = "todo")
public class WorkspaceTagJpaEntity {

  @Id
  @Column(name = "id")
  private UUID id;

  @Column(name = "workspace_id", nullable = false)
  private UUID workspaceId;

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "color")
  private String color;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  public WorkspaceTagJpaEntity() {}

  // Getters & Setters
  public UUID getId() { return id; }
  public void setId(UUID id) { this.id = id; }

  public UUID getWorkspaceId() { return workspaceId; }
  public void setWorkspaceId(UUID workspaceId) { this.workspaceId = workspaceId; }

  public String getName() { return name; }
  public void setName(String name) { this.name = name; }

  public String getColor() { return color; }
  public void setColor(String color) { this.color = color; }

  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
