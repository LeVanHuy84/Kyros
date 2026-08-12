package com.assistant.calendar.domain.model;

import java.util.Objects;
import java.util.UUID;

public record TaskId(UUID value) {
  public TaskId {
    Objects.requireNonNull(value, "Task ID value cannot be null");
  }

  public static TaskId fromString(String value) {
    return new TaskId(UUID.fromString(value));
  }

  @Override
  public String toString() {
    return value.toString();
  }
}
