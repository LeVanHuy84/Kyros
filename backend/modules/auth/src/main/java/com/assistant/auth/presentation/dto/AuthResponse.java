package com.assistant.auth.presentation.dto;

public record AuthResponse(String accessToken, String tokenType, long expiresIn) {}
