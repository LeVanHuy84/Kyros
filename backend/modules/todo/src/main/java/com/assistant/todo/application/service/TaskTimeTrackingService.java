package com.assistant.todo.application.service;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.exception.EntityNotFoundException;
import com.assistant.todo.domain.model.TaskId;
import com.assistant.todo.domain.model.TaskTimeLog;
import com.assistant.todo.domain.repository.TaskRepository;
import com.assistant.todo.domain.repository.TaskTimeLogRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskTimeTrackingService {

  public record ProductivityStatsDto(
      long totalFocusedMinutes,
      int totalSessionsCount,
      double averageSessionMinutes,
      long activeTimerCount) {}

  private final TaskTimeLogRepository timeLogRepository;
  private final TaskRepository taskRepository;

  public TaskTimeTrackingService(
      TaskTimeLogRepository timeLogRepository, TaskRepository taskRepository) {
    this.timeLogRepository = timeLogRepository;
    this.taskRepository = taskRepository;
  }

  @Transactional
  public TaskTimeLog startTimer(WorkspaceId workspaceId, TaskId taskId, UserId userId) {
    if (taskRepository.findById(taskId, workspaceId).isEmpty()) {
      throw new EntityNotFoundException("Task not found");
    }

    Optional<TaskTimeLog> existingActive =
        timeLogRepository.findActiveLog(workspaceId, taskId, userId);
    if (existingActive.isPresent()) {
      return existingActive.get();
    }

    TaskTimeLog newLog = TaskTimeLog.start(workspaceId, taskId, userId);
    return timeLogRepository.save(newLog);
  }

  @Transactional
  public TaskTimeLog stopTimer(
      WorkspaceId workspaceId, TaskId taskId, UserId userId, String notes) {
    Optional<TaskTimeLog> activeLogOpt =
        timeLogRepository.findActiveLog(workspaceId, taskId, userId);

    if (activeLogOpt.isEmpty()) {
      // Graceful fallback: create a completed session of 25 minutes
      return logCompletedSession(workspaceId, taskId, userId, 25, notes, null, null);
    }

    TaskTimeLog activeLog = activeLogOpt.get();
    activeLog.stop(notes);
    TaskTimeLog saved = timeLogRepository.save(activeLog);

    taskRepository
        .findById(taskId, workspaceId)
        .ifPresent(
            task -> {
              int currentEst =
                  task.getEstimatedDurationMinutes() != null
                      ? task.getEstimatedDurationMinutes()
                      : 30;
              // If actual time exceeded estimated, adaptively adjust estimate
              if (saved.getDurationMinutes() > currentEst) {
                task.setEstimatedDurationMinutes((int) saved.getDurationMinutes());
                taskRepository.save(task);
              }
            });

    return saved;
  }

  @Transactional
  public TaskTimeLog logCompletedSession(
      WorkspaceId workspaceId,
      TaskId taskId,
      UserId userId,
      long durationMinutes,
      String notes,
      Instant startTime,
      Instant endTime) {
    if (taskRepository.findById(taskId, workspaceId).isEmpty()) {
      throw new EntityNotFoundException("Task not found");
    }

    // Close any currently active log for this task and user
    timeLogRepository
        .findActiveLog(workspaceId, taskId, userId)
        .ifPresent(
            active -> {
              active.stop(notes);
              timeLogRepository.save(active);
            });

    TaskTimeLog completedLog =
        TaskTimeLog.createCompleted(
            workspaceId, taskId, userId, durationMinutes, notes, startTime, endTime);
    TaskTimeLog saved = timeLogRepository.save(completedLog);

    taskRepository
        .findById(taskId, workspaceId)
        .ifPresent(
            task -> {
              int currentEst =
                  task.getEstimatedDurationMinutes() != null
                      ? task.getEstimatedDurationMinutes()
                      : 30;
              if (saved.getDurationMinutes() > currentEst) {
                task.setEstimatedDurationMinutes((int) saved.getDurationMinutes());
                taskRepository.save(task);
              }
            });

    return saved;
  }

  @Transactional(readOnly = true)
  public Optional<TaskTimeLog> getActiveTimer(
      WorkspaceId workspaceId, TaskId taskId, UserId userId) {
    return timeLogRepository.findActiveLog(workspaceId, taskId, userId);
  }

  @Transactional(readOnly = true)
  public List<TaskTimeLog> getTaskLogs(WorkspaceId workspaceId, TaskId taskId) {
    return timeLogRepository.findByTaskId(workspaceId, taskId);
  }

  @Transactional(readOnly = true)
  public ProductivityStatsDto getProductivityStats(
      WorkspaceId workspaceId, UserId userId, Instant fromTime, Instant toTime) {
    Instant effectiveFrom = fromTime != null ? fromTime : Instant.now().minus(7, ChronoUnit.DAYS);
    Instant effectiveTo = toTime != null ? toTime : Instant.now();

    List<TaskTimeLog> logs =
        timeLogRepository.findByTimeRange(workspaceId, userId, effectiveFrom, effectiveTo);

    long totalMinutes = 0;
    int sessionCount = 0;
    long activeCount = 0;

    for (TaskTimeLog log : logs) {
      if (log.getEndTime() != null) {
        totalMinutes += log.getDurationMinutes();
        sessionCount++;
      } else {
        activeCount++;
      }
    }

    double avgMinutes = sessionCount > 0 ? (double) totalMinutes / sessionCount : 0.0;
    return new ProductivityStatsDto(totalMinutes, sessionCount, avgMinutes, activeCount);
  }
}
