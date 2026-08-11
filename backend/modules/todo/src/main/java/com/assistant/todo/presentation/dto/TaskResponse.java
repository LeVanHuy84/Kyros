package com.assistant.todo.presentation.dto;

import com.assistant.todo.domain.model.Tag;
import com.assistant.todo.domain.model.Task;
import java.time.Instant;
import java.util.Set;
import java.util.stream.Collectors;

public record TaskResponse(
    String taskId,
    String workspaceId,
    String parentTaskId,
    String title,
    String description,
    String priority,
    Set<String> tags,
    Instant dueDate,
    String lifecycleStatus,
    int version,
    Instant createdAt,
    Instant updatedAt) {
  public static TaskResponse fromDomain(Task task) {
    return new TaskResponse(
        task.getId().toString(),
        task.getWorkspaceId().toString(),
        task.getParentTaskId() != null ? task.getParentTaskId().toString() : null,
        task.getTitle(),
        task.getDescription(),
        task.getPriority().name(),
        task.getTags().stream().map(Tag::name).collect(Collectors.toSet()),
        task.getDueDate(),
        task.getLifecycleStatus().name(),
        task.getVersion(),
        task.getCreatedAt(),
        task.getUpdatedAt());
  }
}
