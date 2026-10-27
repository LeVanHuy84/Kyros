package com.assistant.todo.infrastructure.persistence;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.domain.model.TaskId;
import com.assistant.todo.domain.model.TaskTimeLog;
import com.assistant.todo.domain.repository.TaskTimeLogRepository;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    return springDataRepo.findByIdAndWorkspaceId(id, workspaceId.value()).map(this::toDomain);
  }

  @Override
  public void deleteById(UUID id, WorkspaceId workspaceId) {
    springDataRepo.deleteByIdAndWorkspaceId(id, workspaceId.value());
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

  @Override
  public Map<TaskId, TaskDurationSummary> getDurationSummaries(WorkspaceId workspaceId) {
    Map<TaskId, TaskDurationSummary> map = new HashMap<>();
    List<Object[]> summaries =
        springDataRepo.findDurationSummariesByWorkspaceId(workspaceId.value());
    for (Object[] row : summaries) {
      if (row != null && row.length >= 3 && row[0] != null) {
        TaskId taskId = new TaskId((UUID) row[0]);
        long totalMins = row[1] != null ? ((Number) row[1]).longValue() : 0L;
        int count = row[2] != null ? ((Number) row[2]).intValue() : 0;
        map.put(taskId, new TaskDurationSummary(totalMins, count, null));
      }
    }

    List<TaskTimeLogJpaEntity> recentNotes =
        springDataRepo.findRecentNotesByWorkspaceId(workspaceId.value());
    for (TaskTimeLogJpaEntity entity : recentNotes) {
      if (entity.getTaskId() != null) {
        TaskId taskId = new TaskId(entity.getTaskId());
        TaskDurationSummary existing = map.get(taskId);
        if (existing != null && existing.lastNotes() == null) {
          map.put(
              taskId,
              new TaskDurationSummary(
                  existing.totalMinutes(), existing.sessionCount(), entity.getNotes()));
        } else if (existing == null) {
          map.put(taskId, new TaskDurationSummary(0L, 0, entity.getNotes()));
        }
      }
    }

    return map;
  }

  @Override
  public TaskDurationSummary getTaskDurationSummary(WorkspaceId workspaceId, TaskId taskId) {
    List<TaskTimeLog> logs = findByTaskId(workspaceId, taskId);
    long totalMins = 0;
    int count = 0;
    String lastNotes = null;
    for (TaskTimeLog log : logs) {
      if (log.getEndTime() != null) {
        totalMins += log.getDurationMinutes();
        count++;
        if (lastNotes == null && log.getNotes() != null && !log.getNotes().isBlank()) {
          lastNotes = log.getNotes();
        }
      }
    }
    return new TaskDurationSummary(totalMins, count, lastNotes);
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
