package com.assistant.auth.domain;

import com.assistant.kernel.domain.UserId;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public class SessionEvent {

  private final UUID id;
  private final UserId userId;
  private final String jti;
  private final String eventType;
  private final Instant occurredAt;
  private final String metadata;

  public SessionEvent(
      UUID id, UserId userId, String jti, String eventType, Instant occurredAt, String metadata) {
    this.id = Objects.requireNonNull(id, "id cannot be null");
    this.userId = Objects.requireNonNull(userId, "userId cannot be null");
    this.jti = jti; // Can be null
    this.eventType = Objects.requireNonNull(eventType, "eventType cannot be null");
    this.occurredAt = Objects.requireNonNull(occurredAt, "occurredAt cannot be null");
    this.metadata = metadata; // Can be null
  }

  public SessionEvent(UserId userId, String jti, String eventType, String metadata) {
    this(UUID.randomUUID(), userId, jti, eventType, Instant.now(), metadata);
  }

  public UUID getId() {
    return id;
  }

  public UserId getUserId() {
    return userId;
  }

  public String getJti() {
    return jti;
  }

  public String getEventType() {
    return eventType;
  }

  public Instant getOccurredAt() {
    return occurredAt;
  }

  public String getMetadata() {
    return metadata;
  }
}
