package com.assistant.auth.presentation.dto;

public record AuthResponse(
    String accessToken, String refreshToken, String tokenType, long expiresIn) {}
