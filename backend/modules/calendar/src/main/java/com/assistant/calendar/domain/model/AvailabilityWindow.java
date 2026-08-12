package com.assistant.calendar.domain.model;

import java.time.Instant;
import java.util.Objects;

public record AvailabilityWindow(Instant start, Instant end) {
  public AvailabilityWindow {
    Objects.requireNonNull(start, "Window start cannot be null");
    Objects.requireNonNull(end, "Window end cannot be null");
    if (!end.isAfter(start)) {
      throw new IllegalArgumentException("Window end must be after start");
    }
  }
}
