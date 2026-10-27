package com.assistant.todo.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.domain.model.Priority;
import com.assistant.todo.domain.model.Task;
import com.assistant.todo.domain.model.TaskId;
import com.assistant.todo.domain.model.TaskTimeLog;
import com.assistant.todo.domain.repository.TaskRepository;
import com.assistant.todo.domain.repository.TaskTimeLogRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class TaskTimeTrackingServiceTest {

  private TaskTimeLogRepository timeLogRepository;
  private TaskRepository taskRepository;
  private TaskTimeTrackingService timeTrackingService;

  @BeforeEach
  void setUp() {
    timeLogRepository = mock(TaskTimeLogRepository.class);
    taskRepository = mock(TaskRepository.class);
    timeTrackingService = new TaskTimeTrackingService(timeLogRepository, taskRepository);
  }

  @Test
  void testStartTimerSuccess() {
    WorkspaceId wsId = new WorkspaceId(UUID.randomUUID());
    TaskId taskId = TaskId.random();
    UserId userId = new UserId(UUID.randomUUID());

    Task task = new Task(taskId, wsId, "Focus Task", "Desc", Priority.High, null, null);
    when(taskRepository.findById(taskId, wsId)).thenReturn(Optional.of(task));
    when(timeLogRepository.findActiveLog(wsId, taskId, userId)).thenReturn(Optional.empty());
    when(timeLogRepository.save(any(TaskTimeLog.class))).thenAnswer(inv -> inv.getArgument(0));

    TaskTimeLog log = timeTrackingService.startTimer(wsId, taskId, userId);

    assertNotNull(log);
    assertTrue(log.isActive());
    verify(timeLogRepository).save(any(TaskTimeLog.class));
  }

  @Test
  void testStopTimerWithAdaptiveEstimateAdjustment() {
    WorkspaceId wsId = new WorkspaceId(UUID.randomUUID());
    TaskId taskId = TaskId.random();
    UserId userId = new UserId(UUID.randomUUID());

    Task task = new Task(taskId, wsId, "Deep Work Task", "Desc", Priority.High, null, null);
    task.setEstimatedDurationMinutes(30);

    when(taskRepository.findById(taskId, wsId)).thenReturn(Optional.of(task));

    TaskTimeLog activeLog = TaskTimeLog.start(wsId, taskId, userId);
    when(timeLogRepository.findActiveLog(wsId, taskId, userId)).thenReturn(Optional.of(activeLog));
    when(timeLogRepository.save(any(TaskTimeLog.class))).thenAnswer(inv -> inv.getArgument(0));

    TaskTimeLog stopped = timeTrackingService.stopTimer(wsId, taskId, userId, "Finished session");

    assertNotNull(stopped);
    assertFalse(stopped.isActive());
  }

  @Test
  void testGetProductivityStats() {
    WorkspaceId wsId = new WorkspaceId(UUID.randomUUID());
    UserId userId = new UserId(UUID.randomUUID());
    TaskId taskId = TaskId.random();

    Instant now = Instant.now();
    TaskTimeLog log1 =
        TaskTimeLog.createCompleted(
            wsId,
            taskId,
            userId,
            45,
            "Session 1",
            now.minus(2, ChronoUnit.HOURS),
            now.minus(1, ChronoUnit.HOURS));
    TaskTimeLog log2 =
        TaskTimeLog.createCompleted(
            wsId, taskId, userId, 25, "Pomodoro 1", now.minus(1, ChronoUnit.HOURS), now);

    when(timeLogRepository.findByTimeRange(any(), any(), any(), any()))
        .thenReturn(List.of(log1, log2));

    var stats = timeTrackingService.getProductivityStats(wsId, userId, null, null);

    assertNotNull(stats);
    assertEquals(70, stats.totalFocusedMinutes());
    assertEquals(2, stats.totalSessionsCount());
    assertEquals(35.0, stats.averageSessionMinutes(), 0.01);
  }

  @Test
  void testLogCompletedSessionWithMarkCompleted() {
    WorkspaceId wsId = new WorkspaceId(UUID.randomUUID());
    TaskId taskId = TaskId.random();
    UserId userId = new UserId(UUID.randomUUID());

    Task task = new Task(taskId, wsId, "Focus Task", "Desc", Priority.High, null, null);
    when(taskRepository.findById(taskId, wsId)).thenReturn(Optional.of(task));
    when(timeLogRepository.findActiveLog(wsId, taskId, userId)).thenReturn(Optional.empty());
    when(timeLogRepository.save(any(TaskTimeLog.class))).thenAnswer(inv -> inv.getArgument(0));

    TaskTimeLog log =
        timeTrackingService.logCompletedSession(
            wsId, taskId, userId, 25, "Finished slide draft", null, null, true);

    assertNotNull(log);
    assertEquals(25, log.getDurationMinutes());
    assertEquals("Finished slide draft", log.getNotes());
    assertEquals(
        com.assistant.todo.domain.model.TaskLifecycleStatus.Completed, task.getLifecycleStatus());
    verify(taskRepository).save(task);
  }
}
