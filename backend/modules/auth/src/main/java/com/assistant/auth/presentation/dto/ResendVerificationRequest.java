package com.assistant.auth.presentation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ResendVerificationRequest(
    @NotBlank(message = "Email cannot be blank") @Email(message = "Invalid email format")
        String email) {}
