package com.assistant.auth.presentation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
    @NotBlank(message = "auth.email.required") @Email(message = "auth.email.invalid") String email) {}
