package com.assistant.todo.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateWorkspaceTagRequest(
    @NotBlank(message = "Tag name cannot be empty")
        @Size(max = 100, message = "Tag name cannot exceed 100 characters")
        String name,
    @Pattern(
            regexp = "^#[0-9a-fA-F]{6}$",
            message = "Color must be a hex color code in #RRGGBB format")
        String color) {}
