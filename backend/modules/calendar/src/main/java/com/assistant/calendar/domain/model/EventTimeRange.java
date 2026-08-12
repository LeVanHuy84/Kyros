package com.assistant.calendar.domain.model;

import java.time.Instant;
import java.util.Objects;

public record EventTimeRange(Instant startTime, Instant endTime) {
  public EventTimeRange {
    Objects.requireNonNull(startTime, "Start time cannot be null");
    Objects.requireNonNull(endTime, "End time cannot be null");
    if (!endTime.isAfter(startTime)) {
      throw new IllegalArgumentException("End time must be after start time");
    }
  }
}
