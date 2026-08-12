package com.assistant.calendar.domain.model;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;

public record SlotQuery(
    Instant rangeStart,
    Instant rangeEnd,
    Duration desiredDuration,
    int maxResults,
    Duration minimumNotice) {
  public SlotQuery {
    Objects.requireNonNull(rangeStart, "Range start cannot be null");
    Objects.requireNonNull(rangeEnd, "Range end cannot be null");
    Objects.requireNonNull(desiredDuration, "Desired duration cannot be null");
    Objects.requireNonNull(minimumNotice, "Minimum notice cannot be null");
    if (!rangeEnd.isAfter(rangeStart)) {
      throw new IllegalArgumentException("Range end must be after range start");
    }
    if (desiredDuration.isNegative() || desiredDuration.isZero()) {
      throw new IllegalArgumentException("Desired duration must be positive");
    }
    if (minimumNotice.isNegative()) {
      throw new IllegalArgumentException("Minimum notice must not be negative");
    }
    if (maxResults < 1) {
      throw new IllegalArgumentException("Max results must be at least 1");
    }
  }
}
