package com.assistant.calendar.domain.model;

import java.util.Objects;
import java.util.UUID;

public record ReminderId(UUID value) {
  public ReminderId {
    Objects.requireNonNull(value, "Reminder ID value cannot be null");
  }

  public static ReminderId random() {
    return new ReminderId(UUID.randomUUID());
  }

  public static ReminderId fromString(String value) {
    return new ReminderId(UUID.fromString(value));
  }

  @Override
  public String toString() {
    return value.toString();
  }
}
