package com.assistant.memory.presentation.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdatePreferencesRequest(
    @NotBlank(message = "Timezone cannot be blank") String timezone,
    @NotBlank(message = "Default priority cannot be blank")
        @Pattern(
            regexp = "^(High|Medium|Low)$",
            message = "Default priority must be 'High', 'Medium', or 'Low'")
        String defaultPriority,
    boolean preventCalendarOverlap,
    @Min(value = 1, message = "Reminder lead time must be at least 1 minute")
        @Max(value = 10080, message = "Reminder lead time cannot exceed 7 days (10080 minutes)")
        int leadTimeMinutes) {}
