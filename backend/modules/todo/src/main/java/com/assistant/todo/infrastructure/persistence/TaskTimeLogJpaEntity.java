package com.assistant.todo.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "task_time_logs", schema = "todo")
@Filter(name = "workspaceFilter", condition = "workspace_id = :workspaceId")
public class TaskTimeLogJpaEntity {

  @Id
  @Column(name = "id")
  private UUID id;

  @Column(name = "workspace_id", nullable = false)
  private UUID workspaceId;

  @Column(name = "task_id", nullable = false)
  private UUID taskId;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "start_time", nullable = false)
  private Instant startTime;

  @Column(name = "end_time")
  private Instant endTime;

  @Column(name = "duration_minutes", nullable = false)
  private long durationMinutes;

  @Column(name = "notes")
  private String notes;

  public TaskTimeLogJpaEntity() {}

  public TaskTimeLogJpaEntity(
      UUID id,
      UUID workspaceId,
      UUID taskId,
      UUID userId,
      Instant startTime,
      Instant endTime,
      long durationMinutes,
      String notes) {
    this.id = id;
    this.workspaceId = workspaceId;
    this.taskId = taskId;
    this.userId = userId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.durationMinutes = durationMinutes;
    this.notes = notes;
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getWorkspaceId() {
    return workspaceId;
  }

  public void setWorkspaceId(UUID workspaceId) {
    this.workspaceId = workspaceId;
  }

  public UUID getTaskId() {
    return taskId;
  }

  public void setTaskId(UUID taskId) {
    this.taskId = taskId;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public Instant getStartTime() {
    return startTime;
  }

  public void setStartTime(Instant startTime) {
    this.startTime = startTime;
  }

  public Instant getEndTime() {
    return endTime;
  }

  public void setEndTime(Instant endTime) {
    this.endTime = endTime;
  }

  public long getDurationMinutes() {
    return durationMinutes;
  }

  public void setDurationMinutes(long durationMinutes) {
    this.durationMinutes = durationMinutes;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }
}
