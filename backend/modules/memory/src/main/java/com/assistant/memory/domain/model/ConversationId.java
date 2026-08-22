package com.assistant.memory.domain.model;

import java.util.Objects;
import java.util.UUID;

public record ConversationId(UUID value) {
  public ConversationId {
    Objects.requireNonNull(value, "Conversation ID value cannot be null");
  }

  public static ConversationId random() {
    return new ConversationId(UUID.randomUUID());
  }

  public static ConversationId fromString(String val) {
    return new ConversationId(UUID.fromString(val));
  }

  @Override
  public String toString() {
    return value.toString();
  }
}
