package com.assistant.auth.domain;

import com.assistant.kernel.domain.UserId;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public class EmailVerificationToken {
  private final UUID id;
  private final UserId userId;
  private final String token;
  private final Instant expiresAt;
  private final Instant createdAt;

  public EmailVerificationToken(
      UUID id, UserId userId, String token, Instant expiresAt, Instant createdAt) {
    this.id = Objects.requireNonNull(id, "id cannot be null");
    this.userId = Objects.requireNonNull(userId, "userId cannot be null");
    this.token = Objects.requireNonNull(token, "token cannot be null");
    this.expiresAt = Objects.requireNonNull(expiresAt, "expiresAt cannot be null");
    this.createdAt = Objects.requireNonNull(createdAt, "createdAt cannot be null");
  }

  public EmailVerificationToken(UserId userId, String token, Instant expiresAt) {
    this(UUID.randomUUID(), userId, token, expiresAt, Instant.now());
  }

  public UUID getId() {
    return id;
  }

  public UserId getUserId() {
    return userId;
  }

  public String getToken() {
    return token;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public boolean isExpired() {
    return Instant.now().isAfter(expiresAt);
  }
}
