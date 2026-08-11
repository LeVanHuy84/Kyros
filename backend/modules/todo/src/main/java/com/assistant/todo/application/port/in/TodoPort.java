package com.assistant.todo.application.port.in;

import com.assistant.kernel.domain.RecurrencePattern;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.domain.model.Priority;
import com.assistant.todo.domain.model.Tag;
import com.assistant.todo.domain.model.Task;
import com.assistant.todo.domain.model.TaskId;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TodoPort {
  Task createTask(
      WorkspaceId workspaceId,
      String title,
      String description,
      Priority priority,
      Instant dueDate,
      Set<Tag> tags);

  Page<Task> listTasks(
      WorkspaceId workspaceId,
      String title,
      Priority priority,
      String tag,
      Boolean isCompleted,
      Instant dueDateFrom,
      Instant dueDateTo,
      Pageable pageable);

  Page<Task> listSoftDeletedTasks(WorkspaceId workspaceId, Pageable pageable);

  Optional<Task> getTask(TaskId taskId, WorkspaceId workspaceId);

  Task updateTask(
      TaskId taskId,
      WorkspaceId workspaceId,
      String title,
      String description,
      Priority priority,
      Instant dueDate,
      int version);

  void softDeleteTask(TaskId taskId, WorkspaceId workspaceId);

  Task recoverTask(TaskId taskId, WorkspaceId workspaceId);

  Task completeTask(TaskId taskId, WorkspaceId workspaceId);

  Task reopenTask(TaskId taskId, WorkspaceId workspaceId);

  Task addTags(TaskId taskId, WorkspaceId workspaceId, Set<Tag> tags);

  Task removeTag(TaskId taskId, WorkspaceId workspaceId, Tag tag);

  Task configureRecurrence(
      TaskId taskId, WorkspaceId workspaceId, RecurrencePattern pattern, Integer interval);

  Task pauseRecurrence(TaskId taskId, WorkspaceId workspaceId);

  Task resumeRecurrence(TaskId taskId, WorkspaceId workspaceId);

  Task stopRecurrence(TaskId taskId, WorkspaceId workspaceId);
}
