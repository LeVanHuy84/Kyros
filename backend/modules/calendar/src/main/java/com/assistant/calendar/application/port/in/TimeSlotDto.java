package com.assistant.calendar.application.port.in;

import java.time.Instant;

public record TimeSlotDto(Instant startTime, Instant endTime, int durationMinutes) {}
