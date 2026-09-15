package com.assistant.memory.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notes", schema = "memory")
public class NoteJpaEntity {

  @Id private UUID id;

  @Column(name = "workspace_id", nullable = false)
  private UUID workspaceId;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "title", nullable = false)
  private String title;

  @Column(name = "content", columnDefinition = "TEXT")
  private String content;

  @Column(name = "task_id")
  private UUID taskId;

  @Column(name = "event_id")
  private UUID eventId;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Version
  @Column(name = "version", nullable = false)
  private int version;

  public NoteJpaEntity() {}

  public NoteJpaEntity(
      UUID id,
      UUID workspaceId,
      UUID userId,
      String title,
      String content,
      UUID taskId,
      UUID eventId,
      Instant createdAt,
      Instant updatedAt,
      int version) {
    this.id = id;
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.title = title;
    this.content = content;
    this.taskId = taskId;
    this.eventId = eventId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.version = version;
  }

  public UUID getId() {
    return id;
  }

  public UUID getWorkspaceId() {
    return workspaceId;
  }

  public UUID getUserId() {
    return userId;
  }

  public String getTitle() {
    return title;
  }

  public String getContent() {
    return content;
  }

  public UUID getTaskId() {
    return taskId;
  }

  public UUID getEventId() {
    return eventId;
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
}
