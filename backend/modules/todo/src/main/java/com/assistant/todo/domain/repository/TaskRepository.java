package com.assistant.todo.domain.repository;

import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.domain.model.Priority;
import com.assistant.todo.domain.model.Task;
import com.assistant.todo.domain.model.TaskId;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TaskRepository {
  Optional<Task> findById(TaskId taskId, WorkspaceId workspaceId);

  void save(Task task);

  List<Task> findActiveRecurrenceTemplates();

  List<Task> findChildInstances(TaskId parentTaskId);

  List<Task> findSoftDeletedExpiredBefore(Instant threshold);

  void delete(Task task);

  boolean existsChildOccurrence(TaskId parentTaskId, Instant dueDate);

  List<Task> findAll(
      WorkspaceId workspaceId,
      String title,
      Priority priority,
      String tag,
      Boolean isCompleted,
      int offset,
      int limit);

  long countAll(
      WorkspaceId workspaceId, String title, Priority priority, String tag, Boolean isCompleted);

  List<Task> findSoftDeleted(WorkspaceId workspaceId, int offset, int limit);

  long countSoftDeleted(WorkspaceId workspaceId);
}
