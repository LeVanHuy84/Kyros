package com.assistant.todo.domain.model;

import java.util.Objects;
import java.util.UUID;

public record TaskId(UUID value) {
  public TaskId {
    Objects.requireNonNull(value, "Task ID value cannot be null");
  }

  public static TaskId random() {
    return new TaskId(UUID.randomUUID());
  }

  public static TaskId fromString(String val) {
    return new TaskId(UUID.fromString(val));
  }

  @Override
  public String toString() {
    return value.toString();
  }
}
