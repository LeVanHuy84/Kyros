package com.assistant.kernel.event;

import com.assistant.kernel.domain.UserId;
import java.time.Instant;
import java.util.Objects;

public record UserRegistered(UserId userId, String email, Instant occurredAt)
    implements DomainEvent {

  public UserRegistered {
    Objects.requireNonNull(userId, "User ID cannot be null");
    Objects.requireNonNull(email, "Email cannot be null");
    Objects.requireNonNull(occurredAt, "Occurred timestamp cannot be null");
  }

  public UserRegistered(UserId userId, String email) {
    this(userId, email, Instant.now());
  }
}
