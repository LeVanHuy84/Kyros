package com.assistant.calendar.domain.model;

import java.time.Duration;
import java.util.Objects;

public record SnoozeOffset(Duration value) {
  public SnoozeOffset {
    Objects.requireNonNull(value, "Snooze offset cannot be null");
    if (value.isNegative() || value.isZero()) {
      throw new IllegalArgumentException("Snooze offset must be positive");
    }
  }
}
