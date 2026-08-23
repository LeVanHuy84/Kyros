package com.assistant.notification.presentation.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Map;
import java.util.Set;

public record UpdateNotificationProfileRequest(
    @NotNull Map<String, Set<String>> channelRoutingMap,
    String emailAddress,
    String slackWebhookRef,
    String digestSchedule,
    @NotNull String consentPolicy) {}
