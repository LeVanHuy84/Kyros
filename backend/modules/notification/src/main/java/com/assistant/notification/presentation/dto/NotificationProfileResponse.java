package com.assistant.notification.presentation.dto;

import com.assistant.notification.application.dto.NotificationProfileDTO;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public record NotificationProfileResponse(
    UUID workspaceId,
    Map<String, Set<String>> channelRoutingMap,
    String emailAddress,
    String slackWebhookRef,
    String digestSchedule,
    String consentPolicy) {

  public static NotificationProfileResponse fromDTO(NotificationProfileDTO dto) {
    return new NotificationProfileResponse(
        dto.workspaceId(),
        dto.channelRoutingMap(),
        dto.emailAddress(),
        dto.slackWebhookRef(),
        dto.digestSchedule(),
        dto.consentPolicy());
  }
}
