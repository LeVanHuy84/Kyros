package com.assistant.memory.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AppendTurnRequest(
    @NotBlank(message = "Sender role cannot be blank")
        @Pattern(regexp = "^(User|Agent)$", message = "Sender role must be 'User' or 'Agent'")
        String senderRole,
    @NotBlank(message = "Message content cannot be blank") String messageContent) {}
