package com.assistant.calendar.domain.model;

import java.time.Instant;
import java.util.Objects;

public record ReminderTriggerTime(Instant value) {
  public ReminderTriggerTime {
    Objects.requireNonNull(value, "Reminder trigger time cannot be null");
  }
}
