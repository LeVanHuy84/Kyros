package com.assistant.todo.presentation;

import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.RecurrencePattern;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.application.port.in.TodoPort;
import com.assistant.todo.domain.model.Priority;
import com.assistant.todo.domain.model.Tag;
import com.assistant.todo.domain.model.Task;
import com.assistant.todo.domain.model.TaskId;
import com.assistant.todo.presentation.dto.AddTagsRequest;
import com.assistant.todo.presentation.dto.ConfigureRecurrenceRequest;
import com.assistant.todo.presentation.dto.CreateTaskRequest;
import com.assistant.todo.presentation.dto.RecurrenceTemplateResponse;
import com.assistant.todo.presentation.dto.TaskResponse;
import com.assistant.todo.presentation.dto.UpdateTaskRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/tasks")
public class TodoController {

  private final TodoPort todoPort;

  public TodoController(TodoPort todoPort) {
    this.todoPort = todoPort;
  }

  private void validateWorkspace(UUID pathWorkspaceId) {
    UUID authenticatedWorkspaceId = WorkspaceContextHolder.getRequired().value();
    if (!authenticatedWorkspaceId.equals(pathWorkspaceId)) {
      throw new AccessDeniedException("Access denied. You do not have access to this workspace.");
    }
  }

  @PostMapping
  public ResponseEntity<TaskResponse> createTask(
      @PathVariable("workspaceId") UUID workspaceId,
      @Valid @RequestBody CreateTaskRequest request) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);

    Priority priority =
        request.priority() != null ? Priority.valueOf(request.priority()) : Priority.Medium;
    Set<Tag> tags =
        request.tags() != null
            ? request.tags().stream().map(Tag::new).collect(Collectors.toSet())
            : Set.of();

    Task task =
        todoPort.createTask(
            wsId, request.title(), request.description(), priority, request.dueDate(), tags);

    return ResponseEntity.created(
            URI.create("/api/v1/workspaces/" + workspaceId + "/tasks/" + task.getId()))
        .body(TaskResponse.fromDomain(task));
  }

  @GetMapping
  public ResponseEntity<Page<TaskResponse>> listTasks(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestParam(name = "title", required = false) String title,
      @RequestParam(name = "priority", required = false) String priority,
      @RequestParam(name = "tag", required = false) String tag,
      @RequestParam(name = "isCompleted", required = false) Boolean isCompleted,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "50") int size) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    Priority p = priority != null ? Priority.valueOf(priority) : null;
    Pageable pageable = PageRequest.of(page, size);

    Page<TaskResponse> tasks =
        todoPort
            .listTasks(wsId, title, p, tag, isCompleted, pageable)
            .map(TaskResponse::fromDomain);
    return ResponseEntity.ok(tasks);
  }

  @GetMapping("/deleted")
  public ResponseEntity<Page<TaskResponse>> listSoftDeletedTasks(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "50") int size) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    Pageable pageable = PageRequest.of(page, size);

    Page<TaskResponse> tasks =
        todoPort.listSoftDeletedTasks(wsId, pageable).map(TaskResponse::fromDomain);
    return ResponseEntity.ok(tasks);
  }

  @GetMapping("/{taskId}")
  public ResponseEntity<TaskResponse> getTask(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("taskId") UUID taskId) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    TaskId tId = new TaskId(taskId);

    return todoPort
        .getTask(tId, wsId)
        .map(TaskResponse::fromDomain)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @PutMapping("/{taskId}")
  public ResponseEntity<TaskResponse> updateTask(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("taskId") UUID taskId,
      @Valid @RequestBody UpdateTaskRequest request) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    TaskId tId = new TaskId(taskId);
    Priority priority =
        request.priority() != null ? Priority.valueOf(request.priority()) : Priority.Medium;

    Task task =
        todoPort.updateTask(
            tId,
            wsId,
            request.title(),
            request.description(),
            priority,
            request.dueDate(),
            request.version());

    return ResponseEntity.ok(TaskResponse.fromDomain(task));
  }

  @DeleteMapping("/{taskId}")
  public ResponseEntity<Void> softDeleteTask(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("taskId") UUID taskId) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    TaskId tId = new TaskId(taskId);

    todoPort.softDeleteTask(tId, wsId);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{taskId}/recover")
  public ResponseEntity<TaskResponse> recoverTask(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("taskId") UUID taskId) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    TaskId tId = new TaskId(taskId);

    Task task = todoPort.recoverTask(tId, wsId);
    return ResponseEntity.ok(TaskResponse.fromDomain(task));
  }

  @PostMapping("/{taskId}/complete")
  public ResponseEntity<TaskResponse> completeTask(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("taskId") UUID taskId) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    TaskId tId = new TaskId(taskId);

    Task task = todoPort.completeTask(tId, wsId);
    return ResponseEntity.ok(TaskResponse.fromDomain(task));
  }

  @PostMapping("/{taskId}/reopen")
  public ResponseEntity<TaskResponse> reopenTask(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("taskId") UUID taskId) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    TaskId tId = new TaskId(taskId);

    Task task = todoPort.reopenTask(tId, wsId);
    return ResponseEntity.ok(TaskResponse.fromDomain(task));
  }

  @PostMapping("/{taskId}/tags")
  public ResponseEntity<TaskResponse> addTags(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("taskId") UUID taskId,
      @Valid @RequestBody AddTagsRequest request) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    TaskId tId = new TaskId(taskId);
    Set<Tag> tags = request.tags().stream().map(Tag::new).collect(Collectors.toSet());

    Task task = todoPort.addTags(tId, wsId, tags);
    return ResponseEntity.ok(TaskResponse.fromDomain(task));
  }

  @DeleteMapping("/{taskId}/tags/{tag}")
  public ResponseEntity<TaskResponse> removeTag(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("taskId") UUID taskId,
      @PathVariable("tag") String tag) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    TaskId tId = new TaskId(taskId);

    Task task = todoPort.removeTag(tId, wsId, new Tag(tag));
    return ResponseEntity.ok(TaskResponse.fromDomain(task));
  }

  @GetMapping("/{taskId}/recurrence")
  public ResponseEntity<RecurrenceTemplateResponse> getRecurrence(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("taskId") UUID taskId) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    TaskId tId = new TaskId(taskId);

    return todoPort
        .getTask(tId, wsId)
        .map(RecurrenceTemplateResponse::fromDomain)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @PutMapping("/{taskId}/recurrence")
  public ResponseEntity<RecurrenceTemplateResponse> configureRecurrence(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("taskId") UUID taskId,
      @Valid @RequestBody ConfigureRecurrenceRequest request) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    TaskId tId = new TaskId(taskId);
    RecurrencePattern pattern = RecurrencePattern.valueOf(request.pattern());

    Task task = todoPort.configureRecurrence(tId, wsId, pattern, request.interval());
    return ResponseEntity.ok(RecurrenceTemplateResponse.fromDomain(task));
  }

  @PostMapping("/{taskId}/recurrence/pause")
  public ResponseEntity<RecurrenceTemplateResponse> pauseRecurrence(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("taskId") UUID taskId) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    TaskId tId = new TaskId(taskId);

    Task task = todoPort.pauseRecurrence(tId, wsId);
    return ResponseEntity.ok(RecurrenceTemplateResponse.fromDomain(task));
  }

  @PostMapping("/{taskId}/recurrence/resume")
  public ResponseEntity<RecurrenceTemplateResponse> resumeRecurrence(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("taskId") UUID taskId) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    TaskId tId = new TaskId(taskId);

    Task task = todoPort.resumeRecurrence(tId, wsId);
    return ResponseEntity.ok(RecurrenceTemplateResponse.fromDomain(task));
  }

  @PostMapping("/{taskId}/recurrence/stop")
  public ResponseEntity<RecurrenceTemplateResponse> stopRecurrence(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("taskId") UUID taskId) {
    validateWorkspace(workspaceId);
    WorkspaceId wsId = new WorkspaceId(workspaceId);
    TaskId tId = new TaskId(taskId);

    Task task = todoPort.stopRecurrence(tId, wsId);
    return ResponseEntity.ok(RecurrenceTemplateResponse.fromDomain(task));
  }
}
