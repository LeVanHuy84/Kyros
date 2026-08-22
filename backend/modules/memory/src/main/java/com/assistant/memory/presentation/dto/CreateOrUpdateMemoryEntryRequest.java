package com.assistant.memory.presentation.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

public record CreateOrUpdateMemoryEntryRequest(
    @NotBlank(message = "Content cannot be blank") String content,
    @DecimalMin(value = "0.0", message = "Confidence score must be at least 0.0")
        @DecimalMax(value = "1.0", message = "Confidence score cannot exceed 1.0")
        Float confidenceScore) {}
