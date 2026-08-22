package com.assistant.memory.domain.model;

import java.time.Instant;
import java.util.Objects;

public class ConversationTurn {
  private final TurnId id;
  private final SenderRole role;
  private final String content;
  private final Instant timestamp;

  public ConversationTurn(TurnId id, SenderRole role, String content, Instant timestamp) {
    this.id = Objects.requireNonNull(id, "Turn ID cannot be null");
    this.role = Objects.requireNonNull(role, "Sender role cannot be null");
    if (content == null || content.trim().isEmpty()) {
      throw new IllegalArgumentException("Message content cannot be blank");
    }
    this.content = content.trim();
    this.timestamp = Objects.requireNonNull(timestamp, "Timestamp cannot be null");
  }

  public TurnId getId() {
    return id;
  }

  public SenderRole getRole() {
    return role;
  }

  public String getContent() {
    return content;
  }

  public Instant getTimestamp() {
    return timestamp;
  }
}
