package com.assistant.notification.application.dto;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.notification.domain.model.NotificationChannel;
import com.assistant.notification.domain.model.UrgencyLevel;
import java.util.Map;
import java.util.Set;

public record UpdateNotificationProfileCommand(
    WorkspaceId workspaceId,
    UserId userId,
    Map<UrgencyLevel, Set<NotificationChannel>> channelRoutingMap,
    String emailAddress,
    String slackWebhookRef,
    String digestSchedule,
    String consentPolicy) {}
