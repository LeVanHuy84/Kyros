package com.assistant.calendar.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "calendar_reminders", schema = "calendar")
public class ReminderJpaEntity {

  @Id
  @Column(name = "id")
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "event_id", nullable = false)
  private CalendarEventJpaEntity event;

  @Column(name = "lead_time_minutes", nullable = false)
  private int leadTimeMinutes;

  @Column(name = "trigger_time", nullable = false)
  private Instant triggerTime;

  @Column(name = "status", nullable = false)
  private String status;

  @Column(name = "snoozed_until")
  private Instant snoozedUntil;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  public ReminderJpaEntity() {}

  // Getters and Setters
  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public CalendarEventJpaEntity getEvent() {
    return event;
  }

  public void setEvent(CalendarEventJpaEntity event) {
    this.event = event;
  }

  public int getLeadTimeMinutes() {
    return leadTimeMinutes;
  }

  public void setLeadTimeMinutes(int leadTimeMinutes) {
    this.leadTimeMinutes = leadTimeMinutes;
  }

  public Instant getTriggerTime() {
    return triggerTime;
  }

  public void setTriggerTime(Instant triggerTime) {
    this.triggerTime = triggerTime;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public Instant getSnoozedUntil() {
    return snoozedUntil;
  }

  public void setSnoozedUntil(Instant snoozedUntil) {
    this.snoozedUntil = snoozedUntil;
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
}
