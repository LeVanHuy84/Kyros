package com.assistant.calendar.domain.model;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;

public record SchedulingConstraint(
    Duration desiredDuration,
    Instant windowStart,
    Instant windowEnd,
    Duration minimumNotice,
    java.time.LocalTime workingHoursStart,
    java.time.LocalTime workingHoursEnd) {
  public SchedulingConstraint {
    Objects.requireNonNull(desiredDuration, "Desired duration cannot be null");
    Objects.requireNonNull(windowStart, "Window start cannot be null");
    Objects.requireNonNull(windowEnd, "Window end cannot be null");
    Objects.requireNonNull(minimumNotice, "Minimum notice cannot be null");
    Objects.requireNonNull(workingHoursStart, "Working hours start cannot be null");
    Objects.requireNonNull(workingHoursEnd, "Working hours end cannot be null");
    if (!windowEnd.isAfter(windowStart)) {
      throw new IllegalArgumentException("Window end must be after window start");
    }
    if (desiredDuration.isNegative() || desiredDuration.isZero()) {
      throw new IllegalArgumentException("Desired duration must be positive");
    }
    if (minimumNotice.isNegative()) {
      throw new IllegalArgumentException("Minimum notice must not be negative");
    }
  }
}
