package com.assistant.todo.domain.model;

import com.assistant.kernel.domain.RecurrencePattern;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

public class Task {
  private final TaskId id;
  private final WorkspaceId workspaceId;
  private final TaskId parentTaskId;
  private String title;
  private String description;
  private Priority priority;
  private final Set<Tag> tags;
  private Instant dueDate;
  private TaskLifecycleStatus lifecycleStatus;
  private Instant deletedAt;
  private RecurrencePattern recurrencePattern;
  private Integer recurrenceInterval;
  private RecurrenceStatus recurrenceStatus;
  private Instant lastGeneratedOccurrence;
  private final Instant createdAt;
  private Instant updatedAt;
  private int version;

  // Full constructor for rebuilding from DB
  public Task(
      TaskId id,
      WorkspaceId workspaceId,
      TaskId parentTaskId,
      String title,
      String description,
      Priority priority,
      Set<Tag> tags,
      Instant dueDate,
      TaskLifecycleStatus lifecycleStatus,
      Instant deletedAt,
      RecurrencePattern recurrencePattern,
      Integer recurrenceInterval,
      RecurrenceStatus recurrenceStatus,
      Instant lastGeneratedOccurrence,
      Instant createdAt,
      Instant updatedAt,
      int version) {
    this.id = Objects.requireNonNull(id);
    this.workspaceId = Objects.requireNonNull(workspaceId);
    this.parentTaskId = parentTaskId;
    setTitle(title);
    this.description = description;
    this.priority = priority != null ? priority : Priority.Medium;
    this.tags = new HashSet<>(tags != null ? tags : Collections.emptySet());
    this.dueDate = dueDate;
    this.lifecycleStatus = Objects.requireNonNull(lifecycleStatus);
    this.deletedAt = deletedAt;
    this.recurrencePattern = recurrencePattern;
    this.recurrenceInterval = recurrenceInterval;
    this.recurrenceStatus = recurrenceStatus;
    this.lastGeneratedOccurrence = lastGeneratedOccurrence;
    this.createdAt = Objects.requireNonNull(createdAt);
    this.updatedAt = Objects.requireNonNull(updatedAt);
    this.version = version;
  }

  // Constructor for creating new manual task
  public Task(
      TaskId id,
      WorkspaceId workspaceId,
      String title,
      String description,
      Priority priority,
      Instant dueDate,
      Set<Tag> tags) {
    this(
        id,
        workspaceId,
        null,
        title,
        description,
        priority,
        tags,
        dueDate,
        TaskLifecycleStatus.Active,
        null,
        null,
        null,
        null,
        null,
        Instant.now(),
        Instant.now(),
        0);
  }

  // Constructor for creating recurrence instance child
  public Task(
      TaskId id,
      WorkspaceId workspaceId,
      TaskId parentTaskId,
      String title,
      Priority priority,
      Set<Tag> tags,
      Instant dueDate) {
    this(
        id,
        workspaceId,
        Objects.requireNonNull(parentTaskId),
        title,
        null,
        priority,
        tags,
        Objects.requireNonNull(dueDate),
        TaskLifecycleStatus.Active,
        null,
        null,
        null,
        null,
        null,
        Instant.now(),
        Instant.now(),
        0);
  }

  // Invariant: Mutations Blocked on Deleted Tasks
  private void checkNotDeleted() {
    if (lifecycleStatus == TaskLifecycleStatus.SoftDeleted) {
      throw new IllegalStateException("Mutations are blocked on soft-deleted tasks");
    }
  }

  public void update(String title, String description, Priority priority, Instant dueDate) {
    checkNotDeleted();
    setTitle(title);
    this.description = description;
    this.priority = priority != null ? priority : Priority.Medium;
    this.dueDate = dueDate;
    this.updatedAt = Instant.now();
  }

  public void addTag(Tag tag) {
    checkNotDeleted();
    Objects.requireNonNull(tag);
    this.tags.add(tag);
    this.updatedAt = Instant.now();
  }

  public void removeTag(Tag tag) {
    checkNotDeleted();
    this.tags.remove(tag);
    this.updatedAt = Instant.now();
  }

  public void complete() {
    checkNotDeleted();
    this.lifecycleStatus = TaskLifecycleStatus.Completed;
    this.updatedAt = Instant.now();
  }

  public void reopen() {
    checkNotDeleted();
    this.lifecycleStatus = TaskLifecycleStatus.Active;
    this.updatedAt = Instant.now();
  }

  public void softDelete() {
    if (this.lifecycleStatus == TaskLifecycleStatus.SoftDeleted) {
      return;
    }
    this.lifecycleStatus = TaskLifecycleStatus.SoftDeleted;
    this.deletedAt = Instant.now();
    this.updatedAt = Instant.now();
  }

  public void recover() {
    if (this.lifecycleStatus != TaskLifecycleStatus.SoftDeleted) {
      throw new IllegalStateException("Task is not soft-deleted");
    }
    if (deletedAt != null
        && deletedAt.plusSeconds(7200).isBefore(Instant.now())) { // 2-hour window check
      throw new IllegalStateException("Recovery window has expired");
    }
    this.lifecycleStatus = TaskLifecycleStatus.Active;
    this.deletedAt = null;
    this.updatedAt = Instant.now();
  }

  public void attachRecurrence(RecurrencePattern pattern, int interval) {
    checkNotDeleted();
    if (interval < 1) {
      throw new IllegalArgumentException("Recurrence interval must be positive");
    }
    this.recurrencePattern = Objects.requireNonNull(pattern);
    this.recurrenceInterval = interval;
    this.recurrenceStatus = RecurrenceStatus.Active;
    this.updatedAt = Instant.now();
  }

  public void pauseRecurrence() {
    checkNotDeleted();
    if (recurrenceStatus == null) {
      throw new IllegalStateException("No recurrence template attached");
    }
    if (recurrenceStatus == RecurrenceStatus.Stopped) {
      throw new IllegalStateException("Cannot resume or pause from stopped status");
    }
    this.recurrenceStatus = RecurrenceStatus.Paused;
    this.updatedAt = Instant.now();
  }

  public void resumeRecurrence() {
    checkNotDeleted();
    if (recurrenceStatus == null) {
      throw new IllegalStateException("No recurrence template attached");
    }
    if (recurrenceStatus == RecurrenceStatus.Stopped) {
      throw new IllegalStateException("Cannot resume or pause from stopped status");
    }
    this.recurrenceStatus = RecurrenceStatus.Active;
    this.updatedAt = Instant.now();
  }

  public void stopRecurrence() {
    checkNotDeleted();
    if (recurrenceStatus == null) {
      throw new IllegalStateException("No recurrence template attached");
    }
    this.recurrenceStatus = RecurrenceStatus.Stopped;
    this.updatedAt = Instant.now();
  }

  public void recordGeneration(Instant date) {
    this.lastGeneratedOccurrence = Objects.requireNonNull(date);
    this.updatedAt = Instant.now();
  }

  private void setTitle(String title) {
    if (title == null || title.trim().isEmpty()) {
      throw new IllegalArgumentException("Task title cannot be empty");
    }
    this.title = title.trim();
  }

  // Getters
  public TaskId getId() {
    return id;
  }

  public WorkspaceId getWorkspaceId() {
    return workspaceId;
  }

  public TaskId getParentTaskId() {
    return parentTaskId;
  }

  public String getTitle() {
    return title;
  }

  public String getDescription() {
    return description;
  }

  public Priority getPriority() {
    return priority;
  }

  public Set<Tag> getTags() {
    return Collections.unmodifiableSet(tags);
  }

  public Instant getDueDate() {
    return dueDate;
  }

  public TaskLifecycleStatus getLifecycleStatus() {
    return lifecycleStatus;
  }

  public Instant getDeletedAt() {
    return deletedAt;
  }

  public RecurrencePattern getRecurrencePattern() {
    return recurrencePattern;
  }

  public Integer getRecurrenceInterval() {
    return recurrenceInterval;
  }

  public RecurrenceStatus getRecurrenceStatus() {
    return recurrenceStatus;
  }

  public Instant getLastGeneratedOccurrence() {
    return lastGeneratedOccurrence;
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
