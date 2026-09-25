package com.assistant.todo.presentation;

import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.application.service.TaskTimeTrackingService;
import com.assistant.todo.domain.model.TaskId;
import com.assistant.todo.domain.model.TaskTimeLog;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/tasks")
public class TaskTimeTrackingController {

  public record StopTimerRequest(String notes, UUID userId) {}

  public record TimeLogResponse(
      UUID id,
      UUID workspaceId,
      UUID taskId,
      UUID userId,
      Instant startTime,
      Instant endTime,
      long durationMinutes,
      String notes,
      boolean active) {}

  private final TaskTimeTrackingService timeTrackingService;

  public TaskTimeTrackingController(TaskTimeTrackingService timeTrackingService) {
    this.timeTrackingService = timeTrackingService;
  }

  private void validateWorkspace(UUID pathWorkspaceId) {
    UUID authenticatedWorkspaceId = WorkspaceContextHolder.getRequired().value();
    if (!authenticatedWorkspaceId.equals(pathWorkspaceId)) {
      throw new AccessDeniedException("Access denied. You do not have access to this workspace.");
    }
  }

  private UUID resolveUserId(UUID fallback) {
    return fallback != null ? fallback : UUID.fromString("00000000-0000-0000-0000-000000000001");
  }

  @PostMapping("/{taskId}/timer/start")
  public ResponseEntity<TimeLogResponse> startTimer(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("taskId") UUID taskId,
      @RequestParam(name = "userId", required = false) UUID userId) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    TaskId tId = new TaskId(taskId);
    UserId uId = new UserId(resolveUserId(userId));

    TaskTimeLog log = timeTrackingService.startTimer(wsId, tId, uId);
    return ResponseEntity.ok(toResponse(log));
  }

  @PostMapping("/{taskId}/timer/stop")
  public ResponseEntity<TimeLogResponse> stopTimer(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("taskId") UUID taskId,
      @RequestBody(required = false) StopTimerRequest request) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    TaskId tId = new TaskId(taskId);
    UserId uId = new UserId(resolveUserId(request != null ? request.userId() : null));
    String notes = request != null ? request.notes() : null;

    TaskTimeLog log = timeTrackingService.stopTimer(wsId, tId, uId, notes);
    return ResponseEntity.ok(toResponse(log));
  }

  @GetMapping("/{taskId}/timer/logs")
  public ResponseEntity<List<TimeLogResponse>> getTaskLogs(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("taskId") UUID taskId) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    TaskId tId = new TaskId(taskId);

    List<TimeLogResponse> list =
        timeTrackingService.getTaskLogs(wsId, tId).stream()
            .map(this::toResponse)
            .toList();
    return ResponseEntity.ok(list);
  }

  @GetMapping("/productivity/stats")
  public ResponseEntity<TaskTimeTrackingService.ProductivityStatsDto> getProductivityStats(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestParam(name = "userId", required = false) UUID userId,
      @RequestParam(name = "from", required = false) Instant from,
      @RequestParam(name = "to", required = false) Instant to) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    UserId uId = new UserId(resolveUserId(userId));

    var stats = timeTrackingService.getProductivityStats(wsId, uId, from, to);
    return ResponseEntity.ok(stats);
  }

  private TimeLogResponse toResponse(TaskTimeLog log) {
    return new TimeLogResponse(
        log.getId(),
        log.getWorkspaceId().value(),
        log.getTaskId().value(),
        log.getUserId().value(),
        log.getStartTime(),
        log.getEndTime(),
        log.getDurationMinutes(),
        log.getNotes(),
        log.getEndTime() == null);
  }
}
