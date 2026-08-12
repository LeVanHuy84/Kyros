package com.assistant.calendar.application.port.in;

import java.time.Instant;

public record AvailabilityWindowDto(Instant startTime, Instant endTime) {}
