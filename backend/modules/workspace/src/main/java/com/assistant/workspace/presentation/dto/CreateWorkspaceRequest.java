package com.assistant.workspace.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateWorkspaceRequest(
    @NotBlank(message = "Workspace name cannot be blank")
        @Size(max = 100, message = "Workspace name cannot exceed 100 characters")
        String name) {}
