package com.assistant.calendar.presentation.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record RescheduleEventRequest(@NotNull Instant startTime, @NotNull Instant endTime) {}
