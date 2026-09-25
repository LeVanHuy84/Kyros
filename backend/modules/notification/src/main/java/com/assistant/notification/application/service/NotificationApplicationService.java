package com.assistant.notification.application.service;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.event.NotificationEvents;
import com.assistant.kernel.event.WorkspaceProvisioned;
import com.assistant.kernel.exception.EntityNotFoundException;
import com.assistant.notification.application.dto.DismissNotificationCommand;
import com.assistant.notification.application.dto.DispatchNotificationCommand;
import com.assistant.notification.application.dto.GetNotificationProfileQuery;
import com.assistant.notification.application.dto.MarkNotificationReadCommand;
import com.assistant.notification.application.dto.NotificationProfileDTO;
import com.assistant.notification.application.dto.UpdateNotificationProfileCommand;
import com.assistant.notification.application.ports.in.NotificationDispatchPort;
import com.assistant.notification.application.ports.in.NotificationManagementPort;
import com.assistant.notification.application.ports.out.EmailDispatcherPort;
import com.assistant.notification.application.ports.out.SlackDispatcherPort;
import com.assistant.notification.domain.model.InAppNotification;
import com.assistant.notification.domain.model.NotificationChannel;
import com.assistant.notification.domain.model.NotificationProfile;
import com.assistant.notification.domain.model.UrgencyLevel;
import com.assistant.notification.domain.repository.InAppNotificationRepository;
import com.assistant.notification.domain.repository.NotificationProfileRepository;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationApplicationService
    implements NotificationDispatchPort, NotificationManagementPort {

  private final InAppNotificationRepository inAppRepository;
  private final NotificationProfileRepository profileRepository;
  private final EmailDispatcherPort emailDispatcher;
  private final SlackDispatcherPort slackDispatcher;
  private final ApplicationEventPublisher eventPublisher;
  private final String frontendUrl;

  public NotificationApplicationService(
      InAppNotificationRepository inAppRepository,
      NotificationProfileRepository profileRepository,
      EmailDispatcherPort emailDispatcher,
      SlackDispatcherPort slackDispatcher,
      ApplicationEventPublisher eventPublisher,
      @org.springframework.beans.factory.annotation.Value(
              "${app.frontend-url:http://localhost:3000}")
          String frontendUrl) {
    this.inAppRepository = inAppRepository;
    this.profileRepository = profileRepository;
    this.emailDispatcher = emailDispatcher;
    this.slackDispatcher = slackDispatcher;
    this.eventPublisher = eventPublisher;
    this.frontendUrl = frontendUrl;
  }

  @Override
  @Transactional
  @SuppressWarnings("FutureReturnValueIgnored")
  public void dispatch(DispatchNotificationCommand command) {
    NotificationProfile profile = getOrCreateProfile(command.workspaceId(), command.userId());

    Map<UrgencyLevel, Set<NotificationChannel>> routingMap = profile.getChannelRoutingMap();
    Set<NotificationChannel> channels = routingMap.getOrDefault(command.urgencyLevel(), Set.of());

    Set<String> channelsUsed = new HashSet<>();

    // 1. InApp Delivery
    if (channels.contains(NotificationChannel.InApp)) {
      java.util.Map<String, String> metadata = new java.util.HashMap<>();
      if (command.parameters() != null) {
        for (var entry : command.parameters().entrySet()) {
          if (entry.getValue() != null) {
            metadata.put(entry.getKey(), entry.getValue().toString());
          }
        }
      }

      InAppNotification notification =
          new InAppNotification(
              command.workspaceId(),
              command.userId(),
              command.title(),
              command.content(),
              command.urgencyLevel(),
              metadata);
      inAppRepository.save(notification);

      eventPublisher.publishEvent(
          new NotificationEvents.InAppNotificationCreated(
              notification.getId(),
              notification.getWorkspaceId(),
              notification.getUserId(),
              notification.getTitle(),
              notification.getUrgencyLevel().name()));

      channelsUsed.add("InApp");
    }

    // 2. Email Delivery
    if (channels.contains(NotificationChannel.Email)) {
      String email = profile.getEmailAddress();
      if (email != null && !email.trim().isEmpty()) {
        channelsUsed.add("Email");
        java.util.concurrent.CompletableFuture.runAsync(
            () -> {
              try {
                String htmlContent =
                    com.assistant.kernel.util.KyrosEmailTemplate.buildNotificationEmail(
                        command.title(),
                        command.content(),
                        command.urgencyLevel().name(),
                        frontendUrl);
                emailDispatcher.sendEmail(email, command.title(), htmlContent);
              } catch (Exception e) {
                System.err.println("Async email delivery failed for " + email + ": " + e.getMessage());
              }
            });
      }
    }

    // 3. Slack Delivery
    if (channels.contains(NotificationChannel.Slack)) {
      if (command.urgencyLevel() == UrgencyLevel.Urgent
          || command.urgencyLevel() == UrgencyLevel.Critical) {
        String slackRef = profile.getSlackWebhookReference();
        if (slackRef != null && !slackRef.trim().isEmpty()) {
          channelsUsed.add("Slack");
          java.util.concurrent.CompletableFuture.runAsync(
              () -> {
                try {
                  String message =
                      String.format(
                          "[%s] %s: %s", command.urgencyLevel(), command.title(), command.content());
                  slackDispatcher.postMessage(slackRef, message);
                } catch (Exception e) {
                  System.err.println("Async Slack delivery failed: " + e.getMessage());
                }
              });
        }
      }
    }

    // Publish dispatch event
    eventPublisher.publishEvent(
        new NotificationEvents.NotificationDispatched(
            command.workspaceId(), command.userId(), command.urgencyLevel().name(), channelsUsed));
  }

  @Override
  @Transactional
  public void markAsRead(MarkNotificationReadCommand command) {
    InAppNotification notification =
        inAppRepository
            .findById(command.notificationId(), command.workspaceId())
            .orElseThrow(() -> new EntityNotFoundException("Notification not found"));

    if (!notification.getUserId().equals(command.userId())) {
      throw new IllegalArgumentException("User does not own this notification");
    }

    notification.markRead();
    inAppRepository.save(notification);

    eventPublisher.publishEvent(
        new NotificationEvents.InAppNotificationRead(
            notification.getId(), notification.getWorkspaceId(), notification.getUserId()));
  }

  @Override
  @Transactional
  public void dismiss(DismissNotificationCommand command) {
    InAppNotification notification =
        inAppRepository
            .findById(command.notificationId(), command.workspaceId())
            .orElseThrow(() -> new EntityNotFoundException("Notification not found"));

    if (!notification.getUserId().equals(command.userId())) {
      throw new IllegalArgumentException("User does not own this notification");
    }

    notification.dismiss();
    inAppRepository.save(notification);

    eventPublisher.publishEvent(
        new NotificationEvents.InAppNotificationDismissed(
            notification.getId(), notification.getWorkspaceId(), notification.getUserId()));
  }

  @Override
  @Transactional
  public void updateProfile(UpdateNotificationProfileCommand command) {
    NotificationProfile profile = getOrCreateProfile(command.workspaceId(), command.userId());

    profile.update(
        command.channelRoutingMap(),
        command.emailAddress(),
        command.slackWebhookRef(),
        command.digestSchedule(),
        command.consentPolicy());

    profileRepository.save(profile);

    Set<String> changedFields = new HashSet<>();
    changedFields.add("channelRoutingMap");
    changedFields.add("emailAddress");
    changedFields.add("slackWebhookReference");
    changedFields.add("digestSchedule");
    changedFields.add("consentPolicy");

    eventPublisher.publishEvent(
        new NotificationEvents.NotificationProfileUpdated(
            profile.getId(), profile.getWorkspaceId(), profile.getUserId(), changedFields));
  }

  @Override
  @Transactional(readOnly = true)
  public NotificationProfileDTO getProfile(GetNotificationProfileQuery query) {
    NotificationProfile profile = getOrCreateProfile(query.workspaceId(), query.userId());
    return toDTO(profile);
  }

  @EventListener
  @Transactional
  public void onWorkspaceProvisioned(WorkspaceProvisioned event) {
    Optional<NotificationProfile> existing =
        profileRepository.findByCompositeKey(event.workspaceId(), event.ownerId());
    if (existing.isEmpty()) {
      NotificationProfile defaultProfile =
          new NotificationProfile(event.workspaceId(), event.ownerId());
      profileRepository.save(defaultProfile);
      eventPublisher.publishEvent(
          new NotificationEvents.NotificationProfileReset(
              defaultProfile.getId(), event.workspaceId(), event.ownerId()));
    }
  }

  private NotificationProfile getOrCreateProfile(WorkspaceId workspaceId, UserId userId) {
    return profileRepository
        .findByCompositeKey(workspaceId, userId)
        .orElseGet(
            () -> {
              NotificationProfile newProfile = new NotificationProfile(workspaceId, userId);
              profileRepository.save(newProfile);
              return newProfile;
            });
  }

  private NotificationProfileDTO toDTO(NotificationProfile profile) {
    Map<UrgencyLevel, Set<NotificationChannel>> domainMap = profile.getChannelRoutingMap();
    Map<String, Set<String>> stringMap =
        domainMap.entrySet().stream()
            .collect(
                Collectors.toMap(
                    entry -> entry.getKey().name(),
                    entry ->
                        entry.getValue().stream().map(Enum::name).collect(Collectors.toSet())));

    return new NotificationProfileDTO(
        profile.getWorkspaceId().value(),
        profile.getUserId().value(),
        stringMap,
        profile.getEmailAddress(),
        profile.getSlackWebhookReference(),
        profile.getDigestSchedule(),
        profile.getConsentPolicy());
  }
}
