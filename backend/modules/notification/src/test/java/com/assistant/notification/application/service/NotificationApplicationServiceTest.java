package com.assistant.notification.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.event.NotificationEvents;
import com.assistant.notification.application.dto.DispatchNotificationCommand;
import com.assistant.notification.application.dto.MarkNotificationReadCommand;
import com.assistant.notification.application.dto.UpdateNotificationProfileCommand;
import com.assistant.notification.application.ports.out.EmailDispatcherPort;
import com.assistant.notification.application.ports.out.SlackDispatcherPort;
import com.assistant.notification.domain.model.InAppNotification;
import com.assistant.notification.domain.model.InAppNotificationStatus;
import com.assistant.notification.domain.model.NotificationChannel;
import com.assistant.notification.domain.model.NotificationProfile;
import com.assistant.notification.domain.model.UrgencyLevel;
import com.assistant.notification.domain.repository.InAppNotificationRepository;
import com.assistant.notification.domain.repository.NotificationProfileRepository;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;

class NotificationApplicationServiceTest {

  private InAppNotificationRepository inAppRepository;
  private NotificationProfileRepository profileRepository;
  private EmailDispatcherPort emailDispatcher;
  private SlackDispatcherPort slackDispatcher;
  private ApplicationEventPublisher eventPublisher;
  private NotificationApplicationService service;

  private final WorkspaceId workspaceId = new WorkspaceId(UUID.randomUUID());
  private final UserId userId = new UserId(UUID.randomUUID());

  @BeforeEach
  void setUp() {
    inAppRepository = mock(InAppNotificationRepository.class);
    profileRepository = mock(NotificationProfileRepository.class);
    emailDispatcher = mock(EmailDispatcherPort.class);
    slackDispatcher = mock(SlackDispatcherPort.class);
    eventPublisher = mock(ApplicationEventPublisher.class);
    service =
        new NotificationApplicationService(
            inAppRepository,
            profileRepository,
            emailDispatcher,
            slackDispatcher,
            eventPublisher,
            "http://localhost:3000");
  }

  @Test
  void testDispatchInAppNotificationSavesAndPublishes() {
    NotificationProfile profile = new NotificationProfile(workspaceId, userId);
    when(profileRepository.findByCompositeKey(workspaceId, userId))
        .thenReturn(Optional.of(profile));

    DispatchNotificationCommand command =
        new DispatchNotificationCommand(
            workspaceId, userId, "Test Alert", "Alert Content", UrgencyLevel.Normal, Map.of());

    service.dispatch(command);

    verify(inAppRepository, times(1)).save(any(InAppNotification.class));

    ArgumentCaptor<Object> eventCaptor = ArgumentCaptor.forClass(Object.class);
    verify(eventPublisher, times(2)).publishEvent(eventCaptor.capture());

    boolean createdEventFound =
        eventCaptor.getAllValues().stream()
            .anyMatch(e -> e instanceof NotificationEvents.InAppNotificationCreated);
    boolean dispatchedEventFound =
        eventCaptor.getAllValues().stream()
            .anyMatch(e -> e instanceof NotificationEvents.NotificationDispatched);

    assertTrue(createdEventFound);
    assertTrue(dispatchedEventFound);
  }

  @Test
  void testDispatchSlackUrgentChannelSendsSlackMessage() {
    NotificationProfile profile = new NotificationProfile(workspaceId, userId);
    Map<UrgencyLevel, Set<NotificationChannel>> routes = new EnumMap<>(UrgencyLevel.class);
    routes.put(UrgencyLevel.Urgent, EnumSet.of(NotificationChannel.Slack));
    profile.update(routes, null, "vault:slack-webhook-key", "Immediate", "ENABLED");

    when(profileRepository.findByCompositeKey(workspaceId, userId))
        .thenReturn(Optional.of(profile));

    DispatchNotificationCommand command =
        new DispatchNotificationCommand(
            workspaceId, userId, "Urgent Title", "Critical detail", UrgencyLevel.Urgent, Map.of());

    service.dispatch(command);

    verify(slackDispatcher, times(1))
        .postMessage("vault:slack-webhook-key", "[Urgent] Urgent Title: Critical detail");
    verify(inAppRepository, never()).save(any(InAppNotification.class));
  }

  @Test
  void testDispatchSlackNormalChannelSuppressedByInvariants() {
    NotificationProfile profile = new NotificationProfile(workspaceId, userId);
    when(profileRepository.findByCompositeKey(workspaceId, userId))
        .thenReturn(Optional.of(profile));

    // Try to update slack route for Low urgency (should throw exception in domain profile update)
    Map<UrgencyLevel, Set<NotificationChannel>> routes = new EnumMap<>(UrgencyLevel.class);
    routes.put(UrgencyLevel.Low, EnumSet.of(NotificationChannel.Slack));

    assertThrows(
        IllegalArgumentException.class,
        () -> {
          profile.update(routes, null, "vault:slack-webhook-key", "Immediate", "ENABLED");
        });
  }

  @Test
  void testMarkAsReadChangesStatusAndPublishesEvent() {
    UUID notifId = UUID.randomUUID();
    InAppNotification notification =
        new InAppNotification(workspaceId, userId, "Read me", "Content", UrgencyLevel.Normal);

    // Reflection helper to set notification ID if needed, but constructor handles random UUID.
    // We mock finding the notification.
    when(inAppRepository.findById(notifId, workspaceId)).thenReturn(Optional.of(notification));

    service.markAsRead(new MarkNotificationReadCommand(workspaceId, userId, notifId));

    assertEquals(InAppNotificationStatus.Read, notification.getStatus());
    verify(inAppRepository, times(1)).save(notification);

    verify(eventPublisher, times(1))
        .publishEvent(any(NotificationEvents.InAppNotificationRead.class));
  }

  @Test
  void testUpdateProfileEnforcesEmailAddressInvariant() {
    NotificationProfile profile = new NotificationProfile(workspaceId, userId);
    when(profileRepository.findByCompositeKey(workspaceId, userId))
        .thenReturn(Optional.of(profile));

    Map<UrgencyLevel, Set<NotificationChannel>> routes = new EnumMap<>(UrgencyLevel.class);
    routes.put(UrgencyLevel.Normal, EnumSet.of(NotificationChannel.Email));

    UpdateNotificationProfileCommand command =
        new UpdateNotificationProfileCommand(
            workspaceId, userId, routes, "", null, "Immediate", "ENABLED");

    assertThrows(
        IllegalArgumentException.class,
        () -> {
          service.updateProfile(command);
        });
  }
}
