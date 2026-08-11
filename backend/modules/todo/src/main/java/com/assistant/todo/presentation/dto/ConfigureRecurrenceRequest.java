package com.assistant.todo.presentation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ConfigureRecurrenceRequest(
    @NotBlank(message = "Recurrence pattern is required")
        @Pattern(
            regexp = "DAILY|WEEKLY|MONTHLY",
            message = "Recurrence pattern must be DAILY, WEEKLY, or MONTHLY")
        String pattern,
    @Min(value = 1, message = "Recurrence interval must be at least 1") Integer interval) {}
