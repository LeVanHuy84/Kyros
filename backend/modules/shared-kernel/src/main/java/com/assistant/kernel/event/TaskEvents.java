package com.assistant.kernel.event;

import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public final class TaskEvents {
  private TaskEvents() {}

  public record TaskCreated(
      UUID taskId,
      WorkspaceId workspaceId,
      String title,
      String priority,
      Instant dueDate,
      Set<String> tags,
      UUID parentTaskId,
      Instant occurredAt)
      implements DomainEvent {
    public TaskCreated(
        UUID taskId,
        WorkspaceId workspaceId,
        String title,
        String priority,
        Instant dueDate,
        Set<String> tags,
        UUID parentTaskId) {
      this(taskId, workspaceId, title, priority, dueDate, tags, parentTaskId, Instant.now());
    }
  }

  public record TaskUpdated(
      UUID taskId, WorkspaceId workspaceId, Set<String> changedFields, Instant occurredAt)
      implements DomainEvent {
    public TaskUpdated(UUID taskId, WorkspaceId workspaceId, Set<String> changedFields) {
      this(taskId, workspaceId, changedFields, Instant.now());
    }
  }

  public record TaskCompleted(UUID taskId, WorkspaceId workspaceId, Instant occurredAt)
      implements DomainEvent {
    public TaskCompleted(UUID taskId, WorkspaceId workspaceId) {
      this(taskId, workspaceId, Instant.now());
    }
  }

  public record TaskReopened(UUID taskId, WorkspaceId workspaceId, Instant occurredAt)
      implements DomainEvent {
    public TaskReopened(UUID taskId, WorkspaceId workspaceId) {
      this(taskId, workspaceId, Instant.now());
    }
  }

  public record TaskSoftDeleted(UUID taskId, WorkspaceId workspaceId, Instant occurredAt)
      implements DomainEvent {
    public TaskSoftDeleted(UUID taskId, WorkspaceId workspaceId) {
      this(taskId, workspaceId, Instant.now());
    }
  }

  public record TaskRecovered(UUID taskId, WorkspaceId workspaceId, Instant occurredAt)
      implements DomainEvent {
    public TaskRecovered(UUID taskId, WorkspaceId workspaceId) {
      this(taskId, workspaceId, Instant.now());
    }
  }

  public record TaskPurged(UUID taskId, WorkspaceId workspaceId, Instant occurredAt)
      implements DomainEvent {
    public TaskPurged(UUID taskId, WorkspaceId workspaceId) {
      this(taskId, workspaceId, Instant.now());
    }
  }

  public record RecurrenceStarted(
      UUID taskId, WorkspaceId workspaceId, String pattern, int interval, Instant occurredAt)
      implements DomainEvent {
    public RecurrenceStarted(UUID taskId, WorkspaceId workspaceId, String pattern, int interval) {
      this(taskId, workspaceId, pattern, interval, Instant.now());
    }
  }

  public record RecurrencePaused(UUID taskId, WorkspaceId workspaceId, Instant occurredAt)
      implements DomainEvent {
    public RecurrencePaused(UUID taskId, WorkspaceId workspaceId) {
      this(taskId, workspaceId, Instant.now());
    }
  }

  public record RecurrenceResumed(UUID taskId, WorkspaceId workspaceId, Instant occurredAt)
      implements DomainEvent {
    public RecurrenceResumed(UUID taskId, WorkspaceId workspaceId) {
      this(taskId, workspaceId, Instant.now());
    }
  }

  public record RecurrenceStopped(UUID taskId, WorkspaceId workspaceId, Instant occurredAt)
      implements DomainEvent {
    public RecurrenceStopped(UUID taskId, WorkspaceId workspaceId) {
      this(taskId, workspaceId, Instant.now());
    }
  }
}
