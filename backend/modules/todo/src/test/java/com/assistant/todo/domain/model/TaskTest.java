package com.assistant.todo.domain.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.assistant.kernel.domain.RecurrencePattern;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class TaskTest {

  private final WorkspaceId workspaceId = new WorkspaceId(UUID.randomUUID());

  @Test
  void testCreateManualTask() {
    TaskId taskId = TaskId.random();
    Task task =
        new Task(
            taskId,
            workspaceId,
            "Test Title",
            "Description",
            Priority.High,
            null,
            Set.of(new Tag("work")));

    assertEquals(taskId, task.getId());
    assertEquals(workspaceId, task.getWorkspaceId());
    assertEquals("Test Title", task.getTitle());
    assertEquals("Description", task.getDescription());
    assertEquals(Priority.High, task.getPriority());
    assertEquals(TaskLifecycleStatus.Active, task.getLifecycleStatus());
    assertEquals(1, task.getTags().size());
    assertTrue(task.getTags().contains(new Tag("work")));
  }

  @Test
  void testCreateTaskWithEmptyTitleThrowsException() {
    assertThrows(
        IllegalArgumentException.class,
        () -> new Task(TaskId.random(), workspaceId, "", "Desc", Priority.Medium, null, Set.of()));
    assertThrows(
        IllegalArgumentException.class,
        () ->
            new Task(TaskId.random(), workspaceId, "   ", "Desc", Priority.Medium, null, Set.of()));
  }

  @Test
  void testUpdateTask() {
    Task task =
        new Task(
            TaskId.random(), workspaceId, "Old Title", "Old Desc", Priority.Medium, null, Set.of());
    task.update("New Title", "New Desc", Priority.High, null);

    assertEquals("New Title", task.getTitle());
    assertEquals("New Desc", task.getDescription());
    assertEquals(Priority.High, task.getPriority());
  }

  @Test
  void testTagManagement() {
    Task task =
        new Task(TaskId.random(), workspaceId, "Title", "Desc", Priority.Medium, null, Set.of());
    task.addTag(new Tag("urgent"));
    assertEquals(1, task.getTags().size());

    // Adding existing tag is idempotent (silently ignored / set behavior)
    task.addTag(new Tag("urgent"));
    assertEquals(1, task.getTags().size());

    task.removeTag(new Tag("urgent"));
    assertEquals(0, task.getTags().size());
  }

  @Test
  void testSoftDeleteAndRecovery() {
    Task task =
        new Task(TaskId.random(), workspaceId, "Title", "Desc", Priority.Medium, null, Set.of());
    task.softDelete();
    assertEquals(TaskLifecycleStatus.SoftDeleted, task.getLifecycleStatus());
    assertNotNull(task.getDeletedAt());

    // Recovery within window succeeds
    task.recover();
    assertEquals(TaskLifecycleStatus.Active, task.getLifecycleStatus());
    assertNull(task.getDeletedAt());
  }

  @Test
  void testRecoveryExpiredThrowsException() {
    // Reconstruct soft deleted task from 3 hours ago
    Task task =
        new Task(
            TaskId.random(),
            workspaceId,
            null,
            "Title",
            "Desc",
            Priority.Medium,
            Set.of(),
            null,
            TaskLifecycleStatus.SoftDeleted,
            Instant.now().minusSeconds(10800), // 3 hours ago
            null,
            null,
            null,
            null,
            Instant.now().minusSeconds(10800),
            Instant.now().minusSeconds(10800),
            0);

    assertThrows(IllegalStateException.class, task::recover);
  }

  @Test
  void testMutationsBlockedOnDeletedTasks() {
    Task task =
        new Task(TaskId.random(), workspaceId, "Title", "Desc", Priority.Medium, null, Set.of());
    task.softDelete();

    assertThrows(IllegalStateException.class, () -> task.update("New", "New", Priority.High, null));
    assertThrows(IllegalStateException.class, () -> task.addTag(new Tag("tag")));
    assertThrows(IllegalStateException.class, () -> task.complete());
  }

  @Test
  void testRecurrenceTransitions() {
    Task task =
        new Task(TaskId.random(), workspaceId, "Title", "Desc", Priority.Medium, null, Set.of());
    assertNull(task.getRecurrenceStatus());

    task.attachRecurrence(RecurrencePattern.DAILY, 2);
    assertEquals(RecurrencePattern.DAILY, task.getRecurrencePattern());
    assertEquals(2, task.getRecurrenceInterval());
    assertEquals(RecurrenceStatus.Active, task.getRecurrenceStatus());

    task.pauseRecurrence();
    assertEquals(RecurrenceStatus.Paused, task.getRecurrenceStatus());

    task.resumeRecurrence();
    assertEquals(RecurrenceStatus.Active, task.getRecurrenceStatus());

    task.stopRecurrence();
    assertEquals(RecurrenceStatus.Stopped, task.getRecurrenceStatus());

    // Stop is terminal
    assertThrows(IllegalStateException.class, task::resumeRecurrence);
  }
}
