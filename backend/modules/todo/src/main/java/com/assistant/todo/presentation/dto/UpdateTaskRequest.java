package com.assistant.todo.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record UpdateTaskRequest(
    @NotBlank(message = "Task title cannot be empty")
        @Size(max = 255, message = "Task title cannot exceed 255 characters")
        String title,
    String description,
    @Pattern(regexp = "High|Medium|Low", message = "Priority must be High, Medium, or Low")
        String priority,
    Instant dueDate,
    @NotNull(message = "Version is required for optimistic locking") Integer version) {}
