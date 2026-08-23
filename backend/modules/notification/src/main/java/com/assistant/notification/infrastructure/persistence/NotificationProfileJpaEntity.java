package com.assistant.notification.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "profiles", schema = "notification")
@Filter(name = "workspaceFilter", condition = "workspace_id = :workspaceId")
public class NotificationProfileJpaEntity {

  @Id
  @Column(name = "id")
  private UUID id;

  @Column(name = "workspace_id", nullable = false)
  private UUID workspaceId;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Column(name = "urgency_channels_map", nullable = false)
  @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
  private String urgencyChannelsMap;

  @Column(name = "email_address")
  private String emailAddress;

  @Column(name = "slack_webhook_reference")
  private String slackWebhookReference;

  @Column(name = "consent_policy", nullable = false)
  private String consentPolicy;

  @Column(name = "digest_schedule")
  private String digestSchedule;

  @Column(name = "last_digest_sent_at")
  private Instant lastDigestSentAt;

  @Column(name = "next_digest_at")
  private Instant nextDigestAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Version
  @Column(name = "version")
  private int version;

  public NotificationProfileJpaEntity() {}

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

  public String getUrgencyChannelsMap() {
    return urgencyChannelsMap;
  }

  public void setUrgencyChannelsMap(String urgencyChannelsMap) {
    this.urgencyChannelsMap = urgencyChannelsMap;
  }

  public String getEmailAddress() {
    return emailAddress;
  }

  public void setEmailAddress(String emailAddress) {
    this.emailAddress = emailAddress;
  }

  public String getSlackWebhookReference() {
    return slackWebhookReference;
  }

  public void setSlackWebhookReference(String slackWebhookReference) {
    this.slackWebhookReference = slackWebhookReference;
  }

  public String getConsentPolicy() {
    return consentPolicy;
  }

  public void setConsentPolicy(String consentPolicy) {
    this.consentPolicy = consentPolicy;
  }

  public String getDigestSchedule() {
    return digestSchedule;
  }

  public void setDigestSchedule(String digestSchedule) {
    this.digestSchedule = digestSchedule;
  }

  public Instant getLastDigestSentAt() {
    return lastDigestSentAt;
  }

  public void setLastDigestSentAt(Instant lastDigestSentAt) {
    this.lastDigestSentAt = lastDigestSentAt;
  }

  public Instant getNextDigestAt() {
    return nextDigestAt;
  }

  public void setNextDigestAt(Instant nextDigestAt) {
    this.nextDigestAt = nextDigestAt;
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
