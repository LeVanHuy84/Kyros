package com.assistant.notification.presentation;

import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.notification.application.dto.DismissNotificationCommand;
import com.assistant.notification.application.dto.GetNotificationProfileQuery;
import com.assistant.notification.application.dto.MarkNotificationReadCommand;
import com.assistant.notification.application.dto.NotificationProfileDTO;
import com.assistant.notification.application.dto.UpdateNotificationProfileCommand;
import com.assistant.notification.application.ports.in.NotificationManagementPort;
import com.assistant.notification.domain.model.InAppNotification;
import com.assistant.notification.domain.model.NotificationChannel;
import com.assistant.notification.domain.model.UrgencyLevel;
import com.assistant.notification.domain.repository.InAppNotificationRepository;
import com.assistant.notification.presentation.dto.InAppNotificationResponse;
import com.assistant.notification.presentation.dto.NotificationProfileResponse;
import com.assistant.notification.presentation.dto.UpdateNotificationProfileRequest;
import com.assistant.workspace.presentation.SecurityUtils;
import jakarta.validation.Valid;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}")
public class NotificationController {

  private final NotificationManagementPort managementPort;
  private final InAppNotificationRepository inAppRepository;

  public NotificationController(
      NotificationManagementPort managementPort, InAppNotificationRepository inAppRepository) {
    this.managementPort = managementPort;
    this.inAppRepository = inAppRepository;
  }

  private void validateWorkspace(UUID pathWorkspaceId) {
    UUID authenticatedWorkspaceId = WorkspaceContextHolder.getRequired().value();
    if (!authenticatedWorkspaceId.equals(pathWorkspaceId)) {
      throw new AccessDeniedException("Access denied. You do not have access to this workspace.");
    }
  }

  @GetMapping("/notifications")
  public ResponseEntity<Map<String, Object>> getInAppNotifications(
      @PathVariable("workspaceId") UUID workspaceId,
      @RequestParam(name = "status", defaultValue = "Unread") String status,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "20") int size) {
    validateWorkspace(workspaceId);
    UserId userId = SecurityUtils.getCurrentUserId();

    int offset = page * size;
    List<InAppNotification> notifications =
        inAppRepository.findNotifications(
            new WorkspaceId(workspaceId), userId, status, offset, size);

    List<InAppNotificationResponse> data =
        notifications.stream()
            .map(InAppNotificationResponse::fromDomain)
            .collect(Collectors.toList());

    long totalElements =
        inAppRepository.countNotifications(new WorkspaceId(workspaceId), userId, status);
    long totalPages = size > 0 ? (totalElements + size - 1) / size : 1;

    Map<String, Object> response = new HashMap<>();
    response.put("data", data);

    Map<String, Object> meta = new HashMap<>();
    meta.put("page", page);
    meta.put("size", size);
    meta.put("totalElements", totalElements);
    meta.put("totalPages", totalPages);
    response.put("meta", meta);

    return ResponseEntity.ok(response);
  }

  @PostMapping("/notifications/{notificationId}/read")
  public ResponseEntity<Void> markNotificationRead(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("notificationId") UUID notificationId) {
    validateWorkspace(workspaceId);
    UserId userId = SecurityUtils.getCurrentUserId();

    managementPort.markAsRead(
        new MarkNotificationReadCommand(new WorkspaceId(workspaceId), userId, notificationId));

    return ResponseEntity.noContent().build();
  }

  @PostMapping("/notifications/read-all")
  public ResponseEntity<Void> markAllNotificationsRead(
      @PathVariable("workspaceId") UUID workspaceId) {
    validateWorkspace(workspaceId);
    UserId userId = SecurityUtils.getCurrentUserId();

    inAppRepository.markAllRead(new WorkspaceId(workspaceId), userId);

    return ResponseEntity.noContent().build();
  }

  @PostMapping("/notifications/{notificationId}/dismiss")
  public ResponseEntity<Void> dismissNotification(
      @PathVariable("workspaceId") UUID workspaceId,
      @PathVariable("notificationId") UUID notificationId) {
    validateWorkspace(workspaceId);
    UserId userId = SecurityUtils.getCurrentUserId();

    managementPort.dismiss(
        new DismissNotificationCommand(new WorkspaceId(workspaceId), userId, notificationId));

    return ResponseEntity.noContent().build();
  }

  @GetMapping("/notification-profile")
  public ResponseEntity<NotificationProfileResponse> getNotificationProfile(
      @PathVariable("workspaceId") UUID workspaceId) {
    validateWorkspace(workspaceId);
    UserId userId = SecurityUtils.getCurrentUserId();

    NotificationProfileDTO dto =
        managementPort.getProfile(
            new GetNotificationProfileQuery(new WorkspaceId(workspaceId), userId));

    return ResponseEntity.ok(NotificationProfileResponse.fromDTO(dto));
  }

  @PutMapping("/notification-profile")
  public ResponseEntity<NotificationProfileResponse> updateNotificationProfile(
      @PathVariable("workspaceId") UUID workspaceId,
      @Valid @RequestBody UpdateNotificationProfileRequest request) {
    validateWorkspace(workspaceId);
    UserId userId = SecurityUtils.getCurrentUserId();

    Map<UrgencyLevel, Set<NotificationChannel>> domainMap = new EnumMap<>(UrgencyLevel.class);
    for (Map.Entry<String, Set<String>> entry : request.channelRoutingMap().entrySet()) {
      UrgencyLevel level = UrgencyLevel.valueOf(entry.getKey());
      Set<NotificationChannel> channels =
          entry.getValue().stream().map(NotificationChannel::valueOf).collect(Collectors.toSet());
      domainMap.put(level, channels);
    }

    managementPort.updateProfile(
        new UpdateNotificationProfileCommand(
            new WorkspaceId(workspaceId),
            userId,
            domainMap,
            request.emailAddress(),
            request.slackWebhookRef(),
            request.digestSchedule(),
            request.consentPolicy()));

    NotificationProfileDTO dto =
        managementPort.getProfile(
            new GetNotificationProfileQuery(new WorkspaceId(workspaceId), userId));

    return ResponseEntity.ok(NotificationProfileResponse.fromDTO(dto));
  }

  @GetMapping(value = "/notifications/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter streamNotifications(@PathVariable("workspaceId") UUID workspaceId) {
    validateWorkspace(workspaceId);
    UserId userId = SecurityUtils.getCurrentUserId();
    return SseNotificationRegistry.register(new WorkspaceId(workspaceId), userId);
  }

  @org.springframework.context.event.EventListener
  public void onInAppNotificationCreated(
      com.assistant.kernel.event.NotificationEvents.InAppNotificationCreated event) {
    SseNotificationRegistry.send(event.workspaceId(), event.userId(), event);
  }
}
