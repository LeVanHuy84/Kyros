package com.assistant.calendar.domain.model;

import java.time.Duration;
import java.util.Objects;

public record LeadTime(Duration value) {
  public LeadTime {
    Objects.requireNonNull(value, "Lead time cannot be null");
    if (value.isNegative() || value.isZero()) {
      throw new IllegalArgumentException("Lead time must be positive");
    }
  }
}
