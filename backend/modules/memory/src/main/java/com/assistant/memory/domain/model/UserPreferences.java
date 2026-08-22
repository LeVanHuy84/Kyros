package com.assistant.memory.domain.model;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Collections;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

public class UserPreferences {
  private final UUID id;
  private final WorkspaceId workspaceId;
  private final UserId userId;
  private String timezone;
  private String defaultTaskPriority;
  private boolean preventCalendarOverlap;
  private Set<String> preferredNotificationChannels;
  private int defaultReminderLeadTimeMinutes;
  private final Instant createdAt;
  private Instant updatedAt;
  private int version;

  public UserPreferences(
      UUID id,
      WorkspaceId workspaceId,
      UserId userId,
      String timezone,
      String defaultTaskPriority,
      boolean preventCalendarOverlap,
      Set<String> preferredNotificationChannels,
      int defaultReminderLeadTimeMinutes,
      Instant createdAt,
      Instant updatedAt,
      int version) {
    this.id = Objects.requireNonNull(id, "ID cannot be null");
    this.workspaceId = Objects.requireNonNull(workspaceId, "Workspace ID cannot be null");
    this.userId = Objects.requireNonNull(userId, "User ID cannot be null");
    setTimezone(timezone);
    setDefaultTaskPriority(defaultTaskPriority);
    this.preventCalendarOverlap = preventCalendarOverlap;
    setPreferredNotificationChannels(preferredNotificationChannels);
    setDefaultReminderLeadTimeMinutes(defaultReminderLeadTimeMinutes);
    this.createdAt = Objects.requireNonNull(createdAt, "CreatedAt cannot be null");
    this.updatedAt = Objects.requireNonNull(updatedAt, "UpdatedAt cannot be null");
    this.version = version;
  }

  public UserPreferences(WorkspaceId workspaceId, UserId userId) {
    this(
        UUID.randomUUID(),
        workspaceId,
        userId,
        "UTC",
        "Medium",
        false,
        Set.of("InApp", "Email"),
        15,
        Instant.now(),
        Instant.now(),
        0);
  }

  public void update(
      String timezone,
      String defaultTaskPriority,
      boolean preventCalendarOverlap,
      Set<String> preferredNotificationChannels,
      int defaultReminderLeadTimeMinutes) {
    setTimezone(timezone);
    setDefaultTaskPriority(defaultTaskPriority);
    this.preventCalendarOverlap = preventCalendarOverlap;
    setPreferredNotificationChannels(preferredNotificationChannels);
    setDefaultReminderLeadTimeMinutes(defaultReminderLeadTimeMinutes);
    this.updatedAt = Instant.now();
  }

  public void resetToDefaults() {
    this.timezone = "UTC";
    this.defaultTaskPriority = "Medium";
    this.preventCalendarOverlap = false;
    this.preferredNotificationChannels = Set.of("InApp", "Email");
    this.defaultReminderLeadTimeMinutes = 15;
    this.updatedAt = Instant.now();
  }

  private void setTimezone(String timezone) {
    Objects.requireNonNull(timezone, "Timezone cannot be null");
    try {
      ZoneId.of(timezone);
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid timezone identifier: " + timezone);
    }
    this.timezone = timezone;
  }

  private void setDefaultTaskPriority(String defaultTaskPriority) {
    Objects.requireNonNull(defaultTaskPriority, "Default task priority cannot be null");
    if (!defaultTaskPriority.equals("High")
        && !defaultTaskPriority.equals("Medium")
        && !defaultTaskPriority.equals("Low")) {
      throw new IllegalArgumentException("Priority must be one of High, Medium, Low");
    }
    this.defaultTaskPriority = defaultTaskPriority;
  }

  private void setPreferredNotificationChannels(Set<String> preferredNotificationChannels) {
    Objects.requireNonNull(preferredNotificationChannels, "Notification channels cannot be null");
    if (preferredNotificationChannels.isEmpty()) {
      throw new IllegalArgumentException("Notification channels cannot be empty");
    }
    for (String channel : preferredNotificationChannels) {
      if (!channel.equals("InApp") && !channel.equals("Email") && !channel.equals("Slack")) {
        throw new IllegalArgumentException("Invalid notification channel: " + channel);
      }
    }
    this.preferredNotificationChannels = new HashSet<>(preferredNotificationChannels);
  }

  private void setDefaultReminderLeadTimeMinutes(int defaultReminderLeadTimeMinutes) {
    if (defaultReminderLeadTimeMinutes <= 0 || defaultReminderLeadTimeMinutes > 10080) {
      throw new IllegalArgumentException(
          "Reminder lead time must be between 1 and 10080 minutes (7 days)");
    }
    this.defaultReminderLeadTimeMinutes = defaultReminderLeadTimeMinutes;
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

  public String getTimezone() {
    return timezone;
  }

  public String getDefaultTaskPriority() {
    return defaultTaskPriority;
  }

  public boolean isPreventCalendarOverlap() {
    return preventCalendarOverlap;
  }

  public Set<String> getPreferredNotificationChannels() {
    return Collections.unmodifiableSet(preferredNotificationChannels);
  }

  public int getDefaultReminderLeadTimeMinutes() {
    return defaultReminderLeadTimeMinutes;
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
