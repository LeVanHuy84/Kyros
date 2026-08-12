package com.assistant.calendar.domain.model;

import java.time.Instant;
import java.util.Objects;

public record TimeSlot(Instant start, Instant end) {
  public TimeSlot {
    Objects.requireNonNull(start, "Slot start cannot be null");
    Objects.requireNonNull(end, "Slot end cannot be null");
    if (!end.isAfter(start)) {
      throw new IllegalArgumentException("Slot end must be after start");
    }
  }
}
