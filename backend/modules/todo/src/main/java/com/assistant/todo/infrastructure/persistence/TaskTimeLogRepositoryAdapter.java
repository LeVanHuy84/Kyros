package com.assistant.todo.infrastructure.persistence;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.domain.model.TaskId;
import com.assistant.todo.domain.model.TaskTimeLog;
import com.assistant.todo.domain.repository.TaskTimeLogRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class TaskTimeLogRepositoryAdapter implements TaskTimeLogRepository {

  private final SpringDataTaskTimeLogRepository springDataRepo;

  public TaskTimeLogRepositoryAdapter(SpringDataTaskTimeLogRepository springDataRepo) {
    this.springDataRepo = springDataRepo;
  }

  @Override
  public TaskTimeLog save(TaskTimeLog timeLog) {
    TaskTimeLogJpaEntity entity = toEntity(timeLog);
    TaskTimeLogJpaEntity saved = springDataRepo.save(entity);
    return toDomain(saved);
  }

  @Override
  public Optional<TaskTimeLog> findById(UUID id, WorkspaceId workspaceId) {
    return springDataRepo
        .findByIdAndWorkspaceId(id, workspaceId.value())
        .map(this::toDomain);
  }

  @Override
  public Optional<TaskTimeLog> findActiveLog(
      WorkspaceId workspaceId, TaskId taskId, UserId userId) {
    return springDataRepo
        .findActiveLog(workspaceId.value(), taskId.value(), userId.value())
        .map(this::toDomain);
  }

  @Override
  public List<TaskTimeLog> findByTaskId(WorkspaceId workspaceId, TaskId taskId) {
    return springDataRepo
        .findByWorkspaceIdAndTaskIdOrderByStartTimeDesc(workspaceId.value(), taskId.value())
        .stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public List<TaskTimeLog> findByTimeRange(
      WorkspaceId workspaceId, UserId userId, Instant fromTime, Instant toTime) {
    return springDataRepo
        .findByTimeRange(workspaceId.value(), userId.value(), fromTime, toTime)
        .stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  private TaskTimeLogJpaEntity toEntity(TaskTimeLog log) {
    return new TaskTimeLogJpaEntity(
        log.getId(),
        log.getWorkspaceId().value(),
        log.getTaskId().value(),
        log.getUserId().value(),
        log.getStartTime(),
        log.getEndTime(),
        log.getDurationMinutes(),
        log.getNotes());
  }

  private TaskTimeLog toDomain(TaskTimeLogJpaEntity entity) {
    return new TaskTimeLog(
        entity.getId(),
        new WorkspaceId(entity.getWorkspaceId()),
        new TaskId(entity.getTaskId()),
        new UserId(entity.getUserId()),
        entity.getStartTime(),
        entity.getEndTime(),
        entity.getDurationMinutes(),
        entity.getNotes());
  }
}
