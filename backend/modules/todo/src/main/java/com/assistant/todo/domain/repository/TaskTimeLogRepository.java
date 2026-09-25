package com.assistant.todo.domain.repository;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.domain.model.TaskId;
import com.assistant.todo.domain.model.TaskTimeLog;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskTimeLogRepository {
  TaskTimeLog save(TaskTimeLog timeLog);

  Optional<TaskTimeLog> findById(UUID id, WorkspaceId workspaceId);

  Optional<TaskTimeLog> findActiveLog(WorkspaceId workspaceId, TaskId taskId, UserId userId);

  List<TaskTimeLog> findByTaskId(WorkspaceId workspaceId, TaskId taskId);

  List<TaskTimeLog> findByTimeRange(
      WorkspaceId workspaceId, UserId userId, Instant fromTime, Instant toTime);
}
