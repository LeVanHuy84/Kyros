package com.assistant.agent.application.dto;

public record UserAiConfigDto(
    String provider, String apiKey, String baseUrl, String model, boolean hasSavedKey) {}
