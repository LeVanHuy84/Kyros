package com.assistant.notification.domain.model;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

public class NotificationProfile {
  private final UUID id;
  private final WorkspaceId workspaceId;
  private final UserId userId;
  private Map<UrgencyLevel, Set<NotificationChannel>> channelRoutingMap;
  private String emailAddress;
  private String slackWebhookReference;
  private String consentPolicy; // "ENABLED" or "DISABLED"
  private String digestSchedule; // "Immediate", "Daily", "Weekly"
  private Instant lastDigestSentAt;
  private Instant nextDigestAt;
  private final Instant createdAt;
  private Instant updatedAt;
  private int version;

  public NotificationProfile(
      UUID id,
      WorkspaceId workspaceId,
      UserId userId,
      Map<UrgencyLevel, Set<NotificationChannel>> channelRoutingMap,
      String emailAddress,
      String slackWebhookReference,
      String consentPolicy,
      String digestSchedule,
      Instant lastDigestSentAt,
      Instant nextDigestAt,
      Instant createdAt,
      Instant updatedAt,
      int version) {
    this.id = Objects.requireNonNull(id, "ID cannot be null");
    this.workspaceId = Objects.requireNonNull(workspaceId, "Workspace ID cannot be null");
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    this.channelRoutingMap =
        new EnumMap<>(
            Objects.requireNonNull(channelRoutingMap, "Channel routing map cannot be null"));
    this.emailAddress = emailAddress;
    this.slackWebhookReference = slackWebhookReference;
    this.consentPolicy = consentPolicy == null ? "ENABLED" : consentPolicy;
    this.digestSchedule = digestSchedule == null ? "Immediate" : digestSchedule;
    this.lastDigestSentAt = lastDigestSentAt;
    this.nextDigestAt = nextDigestAt;
    this.createdAt = Objects.requireNonNull(createdAt, "CreatedAt cannot be null");
    this.updatedAt = Objects.requireNonNull(updatedAt, "UpdatedAt cannot be null");
    this.version = version;

    // Validate the initial state (except when it's just initialized with defaults where email/slack
    // might not be set yet)
    validateRoutingInvariants(
        this.channelRoutingMap, this.emailAddress, this.slackWebhookReference);
  }

  public NotificationProfile(WorkspaceId workspaceId, UserId userId) {
    this.id = UUID.randomUUID();
    this.workspaceId = Objects.requireNonNull(workspaceId, "Workspace ID cannot be null");
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    this.channelRoutingMap = new EnumMap<>(UrgencyLevel.class);
    for (UrgencyLevel level : UrgencyLevel.values()) {
      this.channelRoutingMap.put(level, EnumSet.of(NotificationChannel.InApp));
    }
    this.emailAddress = null;
    this.slackWebhookReference = null;
    this.consentPolicy = "ENABLED";
    this.digestSchedule = "Immediate";
    this.createdAt = Instant.now();
    this.updatedAt = Instant.now();
    this.version = 0;
  }

  public void update(
      Map<UrgencyLevel, Set<NotificationChannel>> newMap,
      String newEmail,
      String newSlackRef,
      String newDigestSchedule,
      String newConsentPolicy) {

    // Clean inputs
    String email = (newEmail == null || newEmail.trim().isEmpty()) ? null : newEmail.trim();
    String slackRef =
        (newSlackRef == null || newSlackRef.trim().isEmpty()) ? null : newSlackRef.trim();
    String consent = (newConsentPolicy == null) ? "ENABLED" : newConsentPolicy.trim();
    String schedule = (newDigestSchedule == null) ? "Immediate" : newDigestSchedule.trim();

    if (!consent.equals("ENABLED") && !consent.equals("DISABLED")) {
      throw new IllegalArgumentException("Consent policy must be ENABLED or DISABLED");
    }

    if (!schedule.equals("Immediate") && !schedule.equals("Daily") && !schedule.equals("Weekly")) {
      throw new IllegalArgumentException("Digest schedule must be Immediate, Daily, or Weekly");
    }

    // Validate email format if provided
    if (email != null && !email.contains("@")) {
      throw new IllegalArgumentException("Invalid email address format");
    }

    // Check invariants with new parameters
    validateRoutingInvariants(newMap, email, slackRef);

    // Apply updates
    this.channelRoutingMap = new EnumMap<>(newMap);
    this.emailAddress = email;
    this.slackWebhookReference = slackRef;
    this.consentPolicy = consent;
    this.digestSchedule = schedule;
    this.updatedAt = Instant.now();

    // Recalculate next digest time if schedule changed
    recalculateNextDigestAt();
  }

  public void recalculateNextDigestAt() {
    if ("Immediate".equals(digestSchedule)) {
      this.nextDigestAt = null;
    } else if ("Daily".equals(digestSchedule)) {
      this.nextDigestAt = Instant.now().plusSeconds(86400); // 24 hours later
    } else if ("Weekly".equals(digestSchedule)) {
      this.nextDigestAt = Instant.now().plusSeconds(604800); // 7 days later
    }
  }

  public void markDigestSent() {
    this.lastDigestSentAt = Instant.now();
    recalculateNextDigestAt();
    this.updatedAt = Instant.now();
  }

  private void validateRoutingInvariants(
      Map<UrgencyLevel, Set<NotificationChannel>> routingMap, String email, String slackRef) {

    for (Map.Entry<UrgencyLevel, Set<NotificationChannel>> entry : routingMap.entrySet()) {
      UrgencyLevel urgency = entry.getKey();
      Set<NotificationChannel> channels = entry.getValue();

      if (channels == null) {
        continue;
      }

      // Rule: Slack delivery must only be triggered for Urgent or Critical
      if (channels.contains(NotificationChannel.Slack)) {
        if (urgency == UrgencyLevel.Low || urgency == UrgencyLevel.Normal) {
          throw new IllegalArgumentException(
              "Slack channel routing is only allowed for Urgent or Critical urgency levels");
        }
        if (slackRef == null || slackRef.trim().isEmpty()) {
          throw new IllegalArgumentException(
              "Slack webhook reference is required when Slack channel is enabled");
        }
      }

      // Rule: Email channel requires valid email address
      if (channels.contains(NotificationChannel.Email)) {
        if (email == null || email.trim().isEmpty()) {
          throw new IllegalArgumentException(
              "Email address is required when Email channel is enabled");
        }
      }
    }
  }

  public UUID getId() {
    return id;
  }

  public WorkspaceId getWorkspaceId() {
    return workspaceId;
  }

  public UserId getUserId() {
    return userId;
  }

  public Map<UrgencyLevel, Set<NotificationChannel>> getChannelRoutingMap() {
    return new EnumMap<>(channelRoutingMap);
  }

  public String getEmailAddress() {
    return emailAddress;
  }

  public String getSlackWebhookReference() {
    return slackWebhookReference;
  }

  public String getConsentPolicy() {
    return consentPolicy;
  }

  public String getDigestSchedule() {
    return digestSchedule;
  }

  public Instant getLastDigestSentAt() {
    return lastDigestSentAt;
  }

  public Instant getNextDigestAt() {
    return nextDigestAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public int getVersion() {
    return version;
  }
}
