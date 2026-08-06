package com.assistant.todo.infrastructure.persistence;

import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.domain.model.Priority;
import com.assistant.todo.domain.model.Tag;
import com.assistant.todo.domain.model.Task;
import com.assistant.todo.domain.model.TaskId;
import com.assistant.todo.domain.model.TaskLifecycleStatus;
import com.assistant.todo.domain.repository.TaskRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Repository;

@Repository
public class TaskRepositoryAdapter implements TaskRepository {

  private final SpringDataTaskRepository repository;

  public TaskRepositoryAdapter(SpringDataTaskRepository repository) {
    this.repository = repository;
  }

  @Override
  public Optional<Task> findById(TaskId taskId, WorkspaceId workspaceId) {
    return repository
        .findByIdAndWorkspaceId(taskId.value(), workspaceId.value())
        .map(this::toDomain);
  }

  @Override
  public void save(Task task) {
    TaskJpaEntity jpa = toJpa(task);
    repository.save(jpa);
  }

  @Override
  public List<Task> findActiveRecurrenceTemplates() {
    return repository.findActiveRecurrenceTemplates().stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public List<Task> findChildInstances(TaskId parentTaskId) {
    return repository.findChildInstances(parentTaskId.value()).stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public List<Task> findSoftDeletedExpiredBefore(Instant threshold) {
    return repository.findSoftDeletedExpiredBefore(threshold).stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public void delete(Task task) {
    repository.deleteById(task.getId().value());
  }

  @Override
  public boolean existsChildOccurrence(TaskId parentTaskId, Instant dueDate) {
    return repository.existsChildOccurrence(parentTaskId.value(), dueDate);
  }

  @Override
  public List<Task> findAll(
      WorkspaceId workspaceId,
      String title,
      Priority priority,
      String tag,
      Boolean isCompleted,
      int offset,
      int limit) {
    String priorityStr = priority != null ? priority.name() : null;
    String statusStr = null;
    if (isCompleted != null) {
      statusStr = isCompleted ? "Completed" : "Active";
    }

    int page = limit > 0 ? offset / limit : 0;
    org.springframework.data.domain.Pageable pageable =
        org.springframework.data.domain.PageRequest.of(page, limit > 0 ? limit : 50);

    return repository
        .findAllTasksFiltered(workspaceId.value(), title, priorityStr, tag, statusStr, pageable)
        .getContent()
        .stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public long countAll(
      WorkspaceId workspaceId, String title, Priority priority, String tag, Boolean isCompleted) {
    String priorityStr = priority != null ? priority.name() : null;
    String statusStr = null;
    if (isCompleted != null) {
      statusStr = isCompleted ? "Completed" : "Active";
    }
    return repository.countAllTasksFiltered(
        workspaceId.value(), title, priorityStr, tag, statusStr);
  }

  @Override
  public List<Task> findSoftDeleted(WorkspaceId workspaceId, int offset, int limit) {
    int page = limit > 0 ? offset / limit : 0;
    org.springframework.data.domain.Pageable pageable =
        org.springframework.data.domain.PageRequest.of(page, limit > 0 ? limit : 50);

    return repository.findSoftDeletedTasks(workspaceId.value(), pageable).getContent().stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public long countSoftDeleted(WorkspaceId workspaceId) {
    return repository.countSoftDeletedTasks(workspaceId.value());
  }

  private static class RecurrenceRuleParts {
    final com.assistant.kernel.domain.RecurrencePattern pattern;
    final int interval;

    RecurrenceRuleParts(com.assistant.kernel.domain.RecurrencePattern pattern, int interval) {
      this.pattern = pattern;
      this.interval = interval;
    }
  }

  private RecurrenceRuleParts parseRecurrenceRule(String rule) {
    if (rule == null || rule.trim().isEmpty()) {
      return null;
    }
    com.assistant.kernel.domain.RecurrencePattern pattern = null;
    int interval = 1;
    String[] parts = rule.split(";", -1);
    for (String part : parts) {
      if (part.startsWith("FREQ=")) {
        try {
          pattern = com.assistant.kernel.domain.RecurrencePattern.valueOf(part.substring(5));
        } catch (IllegalArgumentException e) {
          // ignore
        }
      } else if (part.startsWith("INTERVAL=")) {
        try {
          interval = Integer.parseInt(part.substring(9));
        } catch (NumberFormatException e) {
          // ignore
        }
      }
    }
    return pattern != null ? new RecurrenceRuleParts(pattern, interval) : null;
  }

  private String serializeRecurrenceRule(
      com.assistant.kernel.domain.RecurrencePattern pattern, Integer interval) {
    if (pattern == null) {
      return null;
    }
    int iv = interval != null ? interval : 1;
    return "FREQ=" + pattern.name() + ";INTERVAL=" + iv;
  }

  private Task toDomain(TaskJpaEntity jpa) {
    TaskLifecycleStatus status =
        jpa.getDeletedAt() != null
            ? TaskLifecycleStatus.SoftDeleted
            : TaskLifecycleStatus.valueOf(jpa.getStatus());

    com.assistant.kernel.domain.RecurrencePattern pattern = null;
    Integer recurrenceInterval = null;
    RecurrenceRuleParts ruleParts = parseRecurrenceRule(jpa.getRecurrenceRule());
    if (ruleParts != null) {
      pattern = ruleParts.pattern;
      recurrenceInterval = ruleParts.interval;
    }

    return new Task(
        new TaskId(jpa.getId()),
        new WorkspaceId(jpa.getWorkspaceId()),
        jpa.getParentTaskId() != null ? new TaskId(jpa.getParentTaskId()) : null,
        jpa.getTitle(),
        jpa.getDescription(),
        Priority.valueOf(jpa.getPriority()),
        jpa.getTags().stream().map(t -> new Tag(t.getName())).collect(Collectors.toSet()),
        jpa.getDueDate(),
        status,
        jpa.getDeletedAt(),
        pattern,
        recurrenceInterval,
        jpa.getRecurrenceStatus() != null
            ? com.assistant.todo.domain.model.RecurrenceStatus.valueOf(jpa.getRecurrenceStatus())
            : null,
        jpa.getLastGeneratedOccurrence(),
        jpa.getCreatedAt(),
        jpa.getUpdatedAt(),
        jpa.getVersion());
  }

  private TaskJpaEntity toJpa(Task domain) {
    TaskJpaEntity jpa = repository.findById(domain.getId().value()).orElseGet(TaskJpaEntity::new);
    jpa.setId(domain.getId().value());
    jpa.setWorkspaceId(domain.getWorkspaceId().value());
    jpa.setParentTaskId(domain.getParentTaskId() != null ? domain.getParentTaskId().value() : null);
    jpa.setTitle(domain.getTitle());
    jpa.setDescription(domain.getDescription());
    jpa.setPriority(domain.getPriority().name());

    // Map SoftDeleted status to Active or Completed based on whether it has deletedAt set
    if (domain.getLifecycleStatus() == TaskLifecycleStatus.SoftDeleted) {
      // If we don't know the prior state, we can default it or check existing status
      if (jpa.getStatus() == null) {
        jpa.setStatus("Active");
      }
    } else {
      jpa.setStatus(domain.getLifecycleStatus().name());
    }

    jpa.setDueDate(domain.getDueDate());
    jpa.setRecurrenceRule(
        serializeRecurrenceRule(domain.getRecurrencePattern(), domain.getRecurrenceInterval()));
    jpa.setRecurrenceStatus(
        domain.getRecurrenceStatus() != null ? domain.getRecurrenceStatus().name() : null);
    jpa.setLastGeneratedOccurrence(domain.getLastGeneratedOccurrence());
    jpa.setDeletedAt(domain.getDeletedAt());
    jpa.setCreatedAt(domain.getCreatedAt());
    jpa.setUpdatedAt(domain.getUpdatedAt());
    jpa.setVersion(domain.getVersion());

    // Map tags
    jpa.getTags().clear();
    List<TagJpaEntity> tags =
        domain.getTags().stream()
            .map(
                t -> {
                  TagJpaEntity tagJpa = new TagJpaEntity();
                  tagJpa.setId(UUID.randomUUID());
                  tagJpa.setName(t.name());
                  tagJpa.setTask(jpa);
                  return tagJpa;
                })
            .collect(Collectors.toList());
    jpa.getTags().addAll(tags);

    return jpa;
  }
}
