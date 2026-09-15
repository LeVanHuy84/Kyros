package com.assistant.memory.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CreateNoteRequest(
    @NotBlank(message = "Title is required") String title,
    String content,
    UUID taskId,
    UUID eventId) {}
