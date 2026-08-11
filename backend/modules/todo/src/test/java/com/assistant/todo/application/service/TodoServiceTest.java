package com.assistant.todo.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.event.TaskEvents.TaskCompleted;
import com.assistant.kernel.event.TaskEvents.TaskCreated;
import com.assistant.todo.application.port.in.TodoPort;
import com.assistant.todo.domain.model.Priority;
import com.assistant.todo.domain.model.Task;
import com.assistant.todo.domain.model.TaskId;
import com.assistant.todo.domain.model.TaskLifecycleStatus;
import com.assistant.todo.domain.repository.TaskRepository;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.OptimisticLockingFailureException;

class TodoServiceTest {

  private TaskRepository taskRepository;
  private ApplicationEventPublisher eventPublisher;
  private TodoPort todoPort;
  private final WorkspaceId workspaceId = new WorkspaceId(UUID.randomUUID());

  @BeforeEach
  void setUp() {
    taskRepository = mock(TaskRepository.class);
    eventPublisher = mock(ApplicationEventPublisher.class);
    todoPort = new TodoService(taskRepository, eventPublisher);
  }

  @Test
  void testCreateTaskSavesAndPublishesEvent() {
    Task task =
        todoPort.createTask(workspaceId, "New Task", "Desc", Priority.Medium, null, Set.of());

    assertNotNull(task);
    assertEquals("New Task", task.getTitle());
    verify(taskRepository, times(1)).save(any(Task.class));

    ArgumentCaptor<Object> eventCaptor = ArgumentCaptor.forClass(Object.class);
    verify(eventPublisher, times(1)).publishEvent(eventCaptor.capture());
    assertTrue(eventCaptor.getValue() instanceof TaskCreated);
    TaskCreated event = (TaskCreated) eventCaptor.getValue();
    assertEquals(task.getId().value(), event.taskId());
    assertEquals(workspaceId, event.workspaceId());
    assertEquals("New Task", event.title());
  }

  @Test
  void testUpdateTaskWithCorrectVersion() {
    TaskId taskId = TaskId.random();
    Task existingTask =
        new Task(taskId, workspaceId, "Old Title", "Desc", Priority.Medium, null, Set.of());
    when(taskRepository.findById(taskId, workspaceId)).thenReturn(Optional.of(existingTask));

    Task updated =
        todoPort.updateTask(taskId, workspaceId, "New Title", "New Desc", Priority.High, null, 0);

    assertEquals("New Title", updated.getTitle());
    verify(taskRepository, times(1)).save(existingTask);
  }

  @Test
  void testUpdateTaskWithIncorrectVersionThrowsException() {
    TaskId taskId = TaskId.random();
    Task existingTask =
        new Task(taskId, workspaceId, "Old Title", "Desc", Priority.Medium, null, Set.of());
    // Existing task has version = 0
    when(taskRepository.findById(taskId, workspaceId)).thenReturn(Optional.of(existingTask));

    assertThrows(
        OptimisticLockingFailureException.class,
        () ->
            todoPort.updateTask(
                taskId,
                workspaceId,
                "New Title",
                "New Desc",
                Priority.High,
                null,
                1) // version mismatch
        );
    verify(taskRepository, never()).save(any());
  }

  @Test
  void testCompleteTaskPublishesCompletedEvent() {
    TaskId taskId = TaskId.random();
    Task existingTask =
        new Task(taskId, workspaceId, "Task", "Desc", Priority.Medium, null, Set.of());
    when(taskRepository.findById(taskId, workspaceId)).thenReturn(Optional.of(existingTask));

    todoPort.completeTask(taskId, workspaceId);

    assertEquals(TaskLifecycleStatus.Completed, existingTask.getLifecycleStatus());
    verify(taskRepository, times(1)).save(existingTask);

    ArgumentCaptor<Object> eventCaptor = ArgumentCaptor.forClass(Object.class);
    verify(eventPublisher, times(1)).publishEvent(eventCaptor.capture());
    assertTrue(eventCaptor.getValue() instanceof TaskCompleted);
  }
}
