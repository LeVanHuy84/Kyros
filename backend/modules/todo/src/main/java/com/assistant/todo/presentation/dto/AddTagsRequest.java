package com.assistant.todo.presentation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record AddTagsRequest(
    @NotNull(message = "Tags set cannot be null")
        @Size(min = 1, message = "At least one tag is required")
        Set<String> tags) {}
