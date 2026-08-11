package com.assistant.todo.presentation.dto;

import com.assistant.todo.domain.model.Task;
import java.time.Instant;

public record RecurrenceTemplateResponse(
    String taskId,
    String pattern,
    int interval,
    Instant lastGeneratedOccurrence,
    String recurrenceStatus) {
  public static RecurrenceTemplateResponse fromDomain(Task task) {
    return new RecurrenceTemplateResponse(
        task.getId().toString(),
        task.getRecurrencePattern() != null ? task.getRecurrencePattern().name() : null,
        task.getRecurrenceInterval() != null ? task.getRecurrenceInterval() : 0,
        task.getLastGeneratedOccurrence(),
        task.getRecurrenceStatus() != null ? task.getRecurrenceStatus().name() : null);
  }
}
