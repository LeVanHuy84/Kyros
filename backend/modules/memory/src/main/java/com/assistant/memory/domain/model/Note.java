package com.assistant.memory.domain.model;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public class Note {
  private final NoteId id;
  private final WorkspaceId workspaceId;
  private final UserId userId;
  private String title;
  private String content;
  private UUID taskId;
  private UUID eventId;
  private final Instant createdAt;
  private Instant updatedAt;
  private int version;

  public Note(
      NoteId id,
      WorkspaceId workspaceId,
      UserId userId,
      String title,
      String content,
      UUID taskId,
      UUID eventId,
      Instant createdAt,
      Instant updatedAt,
      int version) {
    this.id = Objects.requireNonNull(id, "Note ID cannot be null");
    this.workspaceId = Objects.requireNonNull(workspaceId, "Workspace ID cannot be null");
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    setTitle(title);
    this.content = content;
    this.taskId = taskId;
    this.eventId = eventId;
    this.createdAt = Objects.requireNonNull(createdAt, "CreatedAt cannot be null");
    this.updatedAt = Objects.requireNonNull(updatedAt, "UpdatedAt cannot be null");
    this.version = version;
  }

  public Note(
      NoteId id,
      WorkspaceId workspaceId,
      UserId userId,
      String title,
      String content,
      UUID taskId,
      UUID eventId) {
    this(id, workspaceId, userId, title, content, taskId, eventId, Instant.now(), Instant.now(), 0);
  }

  public void update(String title, String content, UUID taskId, UUID eventId) {
    setTitle(title);
    this.content = content;
    this.taskId = taskId;
    this.eventId = eventId;
    this.updatedAt = Instant.now();
  }

  private void setTitle(String title) {
    if (title == null || title.trim().isEmpty()) {
      throw new IllegalArgumentException("Note title cannot be empty");
    }
    this.title = title.trim();
  }

  public NoteId getId() {
    return id;
  }

  public WorkspaceId getWorkspaceId() {
    return workspaceId;
  }

  public UserId getUserId() {
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
