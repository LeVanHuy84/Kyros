package com.assistant.calendar.domain.model;

import java.util.Objects;
import java.util.UUID;

public record EventId(UUID value) {
  public EventId {
    Objects.requireNonNull(value, "Event ID value cannot be null");
  }

  public static EventId random() {
    return new EventId(UUID.randomUUID());
  }

  public static EventId fromString(String value) {
    return new EventId(UUID.fromString(value));
  }

  @Override
  public String toString() {
    return value.toString();
  }
}
