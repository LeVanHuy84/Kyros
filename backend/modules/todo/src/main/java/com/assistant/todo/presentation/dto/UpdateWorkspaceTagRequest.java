package com.assistant.todo.presentation.dto;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record UpdateWorkspaceTagRequest(
    @Size(max = 100, message = "Tag name cannot exceed 100 characters") String name,
    @Pattern(
            regexp = "^#[0-9a-fA-F]{6}$",
            message = "Color must be a hex color code in #RRGGBB format")
        String color) {}
