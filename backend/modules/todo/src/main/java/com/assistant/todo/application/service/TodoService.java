package com.assistant.todo.application.service;

import com.assistant.kernel.domain.RecurrencePattern;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.event.TaskEvents.RecurrencePaused;
import com.assistant.kernel.event.TaskEvents.RecurrenceResumed;
import com.assistant.kernel.event.TaskEvents.RecurrenceStarted;
import com.assistant.kernel.event.TaskEvents.RecurrenceStopped;
import com.assistant.kernel.event.TaskEvents.TaskCompleted;
import com.assistant.kernel.event.TaskEvents.TaskCreated;
import com.assistant.kernel.event.TaskEvents.TaskRecovered;
import com.assistant.kernel.event.TaskEvents.TaskReopened;
import com.assistant.kernel.event.TaskEvents.TaskSoftDeleted;
import com.assistant.kernel.event.TaskEvents.TaskUpdated;
import com.assistant.kernel.exception.EntityNotFoundException;
import com.assistant.todo.application.port.in.TodoPort;
import com.assistant.todo.domain.model.Priority;
import com.assistant.todo.domain.model.Tag;
import com.assistant.todo.domain.model.Task;
import com.assistant.todo.domain.model.TaskId;
import com.assistant.todo.domain.repository.TaskRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TodoService implements TodoPort {

  private final TaskRepository taskRepository;
  private final ApplicationEventPublisher eventPublisher;

  public TodoService(TaskRepository taskRepository, ApplicationEventPublisher eventPublisher) {
    this.taskRepository = taskRepository;
    this.eventPublisher = eventPublisher;
  }

  private Task loadTask(TaskId taskId, WorkspaceId workspaceId) {
    return taskRepository
        .findById(taskId, workspaceId)
        .orElseThrow(() -> new EntityNotFoundException("Task not found with ID: " + taskId));
  }

  @Override
  public Task createTask(
      WorkspaceId workspaceId,
      String title,
      String description,
      Priority priority,
      Instant dueDate,
      Set<Tag> tags) {
    Task task = new Task(TaskId.random(), workspaceId, title, description, priority, dueDate, tags);
    taskRepository.save(task);

    eventPublisher.publishEvent(
        new TaskCreated(
            task.getId().value(),
            task.getWorkspaceId(),
            task.getTitle(),
            task.getPriority().name(),
            task.getDueDate(),
            task.getTags().stream().map(Tag::name).collect(Collectors.toSet()),
            null));

    return task;
  }

  @Override
  @Transactional(readOnly = true)
  public Page<Task> listTasks(
      WorkspaceId workspaceId,
      String title,
      Priority priority,
      String tag,
      Boolean isCompleted,
      Instant dueDateFrom,
      Instant dueDateTo,
      Pageable pageable) {
    int offset = (int) pageable.getOffset();
    int limit = pageable.getPageSize();
    java.util.List<Task> content =
        taskRepository.findAll(
            workspaceId, title, priority, tag, isCompleted, dueDateFrom, dueDateTo, offset, limit);
    long total =
        taskRepository.countAll(
            workspaceId, title, priority, tag, isCompleted, dueDateFrom, dueDateTo);
    return new org.springframework.data.domain.PageImpl<>(content, pageable, total);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<Task> listSoftDeletedTasks(WorkspaceId workspaceId, Pageable pageable) {
    int offset = (int) pageable.getOffset();
    int limit = pageable.getPageSize();
    java.util.List<Task> content = taskRepository.findSoftDeleted(workspaceId, offset, limit);
    long total = taskRepository.countSoftDeleted(workspaceId);
    return new org.springframework.data.domain.PageImpl<>(content, pageable, total);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<Task> getTask(TaskId taskId, WorkspaceId workspaceId) {
    return taskRepository.findById(taskId, workspaceId);
  }

  @Override
  public Task updateTask(
      TaskId taskId,
      WorkspaceId workspaceId,
      String title,
      String description,
      Priority priority,
      Instant dueDate,
      int version) {
    Task task = loadTask(taskId, workspaceId);
    if (task.getVersion() != version) {
      throw new OptimisticLockingFailureException(
          "Task was updated by another request. Reload task and try again.");
    }
    task.update(title, description, priority, dueDate);
    taskRepository.save(task);

    eventPublisher.publishEvent(
        new TaskUpdated(
            task.getId().value(),
            task.getWorkspaceId(),
            Set.of("title", "description", "priority", "dueDate")));

    return task;
  }

  @Override
  public void softDeleteTask(TaskId taskId, WorkspaceId workspaceId) {
    Task task = loadTask(taskId, workspaceId);
    task.softDelete();
    taskRepository.save(task);

    eventPublisher.publishEvent(new TaskSoftDeleted(task.getId().value(), task.getWorkspaceId()));
  }

  @Override
  public Task recoverTask(TaskId taskId, WorkspaceId workspaceId) {
    Task task = loadTask(taskId, workspaceId);
    task.recover();
    taskRepository.save(task);

    eventPublisher.publishEvent(new TaskRecovered(task.getId().value(), task.getWorkspaceId()));

    return task;
  }

  @Override
  public Task completeTask(TaskId taskId, WorkspaceId workspaceId) {
    Task task = loadTask(taskId, workspaceId);
    task.complete();
    taskRepository.save(task);

    eventPublisher.publishEvent(new TaskCompleted(task.getId().value(), task.getWorkspaceId()));

    return task;
  }

  @Override
  public Task reopenTask(TaskId taskId, WorkspaceId workspaceId) {
    Task task = loadTask(taskId, workspaceId);
    task.reopen();
    taskRepository.save(task);

    eventPublisher.publishEvent(new TaskReopened(task.getId().value(), task.getWorkspaceId()));

    return task;
  }

  @Override
  public Task addTags(TaskId taskId, WorkspaceId workspaceId, Set<Tag> tags) {
    Task task = loadTask(taskId, workspaceId);
    tags.forEach(task::addTag);
    taskRepository.save(task);

    eventPublisher.publishEvent(
        new TaskUpdated(task.getId().value(), task.getWorkspaceId(), Set.of("tags")));

    return task;
  }

  @Override
  public Task removeTag(TaskId taskId, WorkspaceId workspaceId, Tag tag) {
    Task task = loadTask(taskId, workspaceId);
    task.removeTag(tag);
    taskRepository.save(task);

    eventPublisher.publishEvent(
        new TaskUpdated(task.getId().value(), task.getWorkspaceId(), Set.of("tags")));

    return task;
  }

  @Override
  public Task configureRecurrence(
      TaskId taskId, WorkspaceId workspaceId, RecurrencePattern pattern, Integer interval) {
    Task task = loadTask(taskId, workspaceId);
    task.attachRecurrence(pattern, interval != null ? interval : 1);
    taskRepository.save(task);

    eventPublisher.publishEvent(
        new RecurrenceStarted(
            task.getId().value(),
            task.getWorkspaceId(),
            pattern.name(),
            interval != null ? interval : 1));

    return task;
  }

  @Override
  public Task pauseRecurrence(TaskId taskId, WorkspaceId workspaceId) {
    Task task = loadTask(taskId, workspaceId);
    task.pauseRecurrence();
    taskRepository.save(task);

    eventPublisher.publishEvent(new RecurrencePaused(task.getId().value(), task.getWorkspaceId()));

    return task;
  }

  @Override
  public Task resumeRecurrence(TaskId taskId, WorkspaceId workspaceId) {
    Task task = loadTask(taskId, workspaceId);
    task.resumeRecurrence();
    taskRepository.save(task);

    eventPublisher.publishEvent(new RecurrenceResumed(task.getId().value(), task.getWorkspaceId()));

    return task;
  }

  @Override
  public Task stopRecurrence(TaskId taskId, WorkspaceId workspaceId) {
    Task task = loadTask(taskId, workspaceId);
    task.stopRecurrence();
    taskRepository.save(task);

    eventPublisher.publishEvent(new RecurrenceStopped(task.getId().value(), task.getWorkspaceId()));

    return task;
  }
}
