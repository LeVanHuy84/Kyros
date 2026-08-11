package com.assistant.todo.domain.service;

import com.assistant.todo.domain.model.Task;
import com.assistant.todo.domain.model.TaskId;
import com.assistant.todo.domain.repository.TaskRepository;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Optional;

public class RecurrenceInstanceGenerationService {

  public static class GenerationResult {
    public final Task parent;
    public final Task child;

    public GenerationResult(Task parent, Task child) {
      this.parent = parent;
      this.child = child;
    }
  }

  public Optional<GenerationResult> generateNextInstance(
      Task parent, TaskRepository taskRepository) {
    if (parent.getRecurrenceStatus() != com.assistant.todo.domain.model.RecurrenceStatus.Active) {
      return Optional.empty();
    }

    Instant basis =
        parent.getLastGeneratedOccurrence() != null
            ? parent.getLastGeneratedOccurrence()
            : parent.getDueDate();

    if (basis == null) {
      return Optional.empty();
    }

    Instant nextDueDate =
        calculateNextOccurrence(
            basis, parent.getRecurrencePattern(), parent.getRecurrenceInterval());

    // Guard against duplicate occurrence due dates
    if (taskRepository.existsChildOccurrence(parent.getId(), nextDueDate)) {
      return Optional.empty();
    }

    // Generate child
    Task child =
        new Task(
            TaskId.random(),
            parent.getWorkspaceId(),
            parent.getId(),
            parent.getTitle(),
            parent.getPriority(),
            parent.getTags(),
            nextDueDate);

    parent.recordGeneration(nextDueDate);

    return Optional.of(new GenerationResult(parent, child));
  }

  private Instant calculateNextOccurrence(
      Instant basis, com.assistant.kernel.domain.RecurrencePattern pattern, int interval) {
    ZonedDateTime zdt = basis.atZone(ZoneId.of("UTC"));
    ZonedDateTime nextZdt =
        switch (pattern) {
          case DAILY -> zdt.plusDays(interval);
          case WEEKLY -> zdt.plusWeeks(interval);
          case MONTHLY -> zdt.plusMonths(interval);
        };
    return nextZdt.toInstant();
  }
}
