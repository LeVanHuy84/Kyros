package com.assistant.auth.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
    @NotBlank(message = "auth.token.required") String token,
    @NotBlank(message = "auth.password.required")
        @Size(min = 8, message = "auth.password.min_length")
        String newPassword) {}
