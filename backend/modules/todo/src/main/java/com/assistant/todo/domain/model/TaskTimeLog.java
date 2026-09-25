package com.assistant.todo.domain.model;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public class TaskTimeLog {
  private final UUID id;
  private final WorkspaceId workspaceId;
  private final TaskId taskId;
  private final UserId userId;
  private final Instant startTime;
  private Instant endTime;
  private long durationMinutes;
  private String notes;

  public TaskTimeLog(
      UUID id,
      WorkspaceId workspaceId,
      TaskId taskId,
      UserId userId,
      Instant startTime,
      Instant endTime,
      long durationMinutes,
      String notes) {
    this.id = Objects.requireNonNull(id);
    this.workspaceId = Objects.requireNonNull(workspaceId);
    this.taskId = Objects.requireNonNull(taskId);
    this.userId = Objects.requireNonNull(userId);
    this.startTime = Objects.requireNonNull(startTime);
    this.endTime = endTime;
    this.durationMinutes = durationMinutes;
    this.notes = notes;
  }

  public static TaskTimeLog start(WorkspaceId workspaceId, TaskId taskId, UserId userId) {
    return new TaskTimeLog(
        UUID.randomUUID(), workspaceId, taskId, userId, Instant.now(), null, 0, null);
  }

  public void stop(String notes) {
    this.endTime = Instant.now();
    this.durationMinutes = Math.max(1, Duration.between(startTime, endTime).toMinutes());
    this.notes = notes;
  }

  public UUID getId() {
    return id;
  }

  public WorkspaceId getWorkspaceId() {
    return workspaceId;
  }

  public TaskId getTaskId() {
    return taskId;
  }

  public UserId getUserId() {
    return userId;
  }

  public Instant getStartTime() {
    return startTime;
  }

  public Instant getEndTime() {
    return endTime;
  }

  public long getDurationMinutes() {
    return durationMinutes;
  }

  public String getNotes() {
    return notes;
  }
}
