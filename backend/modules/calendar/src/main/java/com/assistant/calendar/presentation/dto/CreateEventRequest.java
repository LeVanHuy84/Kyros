package com.assistant.calendar.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public record CreateEventRequest(
    @NotBlank String userId,
    String taskId,
    @NotBlank @Size(max = 255) String title,
    String description,
    @NotNull Instant startTime,
    @NotNull Instant endTime,
    List<Integer> reminderOffsetsMinutes) {}
