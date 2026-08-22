package com.assistant.memory.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "user_preferences", schema = "memory")
@Filter(name = "workspaceFilter", condition = "workspace_id = :workspaceId")
public class UserPreferencesJpaEntity {

  @Id
  @Column(name = "id")
  private UUID id;

  @Column(name = "workspace_id", nullable = false)
  private UUID workspaceId;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "timezone", nullable = false)
  private String timezone;

  @Column(name = "default_task_priority", nullable = false)
  private String defaultTaskPriority;

  @Column(name = "prevent_calendar_overlap", nullable = false)
  private boolean preventCalendarOverlap;

  @Column(name = "preferred_notification_channels", nullable = false)
  private String preferredNotificationChannels;

  @Column(name = "default_reminder_lead_time_minutes", nullable = false)
  private int defaultReminderLeadTimeMinutes;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Version
  @Column(name = "version")
  private int version;

  public UserPreferencesJpaEntity() {}

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getWorkspaceId() {
    return workspaceId;
  }

  public void setWorkspaceId(UUID workspaceId) {
    this.workspaceId = workspaceId;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public String getTimezone() {
    return timezone;
  }

  public void setTimezone(String timezone) {
    this.timezone = timezone;
  }

  public String getDefaultTaskPriority() {
    return defaultTaskPriority;
  }

  public void setDefaultTaskPriority(String defaultTaskPriority) {
    this.defaultTaskPriority = defaultTaskPriority;
  }

  public boolean isPreventCalendarOverlap() {
    return preventCalendarOverlap;
  }

  public void setPreventCalendarOverlap(boolean preventCalendarOverlap) {
    this.preventCalendarOverlap = preventCalendarOverlap;
  }

  public String getPreferredNotificationChannels() {
    return preferredNotificationChannels;
  }

  public void setPreferredNotificationChannels(String preferredNotificationChannels) {
    this.preferredNotificationChannels = preferredNotificationChannels;
  }

  public int getDefaultReminderLeadTimeMinutes() {
    return defaultReminderLeadTimeMinutes;
  }

  public void setDefaultReminderLeadTimeMinutes(int defaultReminderLeadTimeMinutes) {
    this.defaultReminderLeadTimeMinutes = defaultReminderLeadTimeMinutes;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  public int getVersion() {
    return version;
  }

  public void setVersion(int version) {
    this.version = version;
  }
}
