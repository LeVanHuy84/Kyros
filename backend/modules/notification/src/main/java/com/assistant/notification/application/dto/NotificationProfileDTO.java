package com.assistant.notification.application.dto;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

public record NotificationProfileDTO(
    UUID workspaceId,
    UUID userId,
    Map<String, Set<String>> channelRoutingMap,
    String emailAddress,
    String slackWebhookRef,
    String digestSchedule,
    String consentPolicy) {}
