package com.assistant.memory.domain.model;

import java.util.Objects;
import java.util.UUID;

public record TurnId(UUID value) {
  public TurnId {
    Objects.requireNonNull(value, "Turn ID value cannot be null");
  }

  public static TurnId random() {
    return new TurnId(UUID.randomUUID());
  }

  public static TurnId fromString(String val) {
    return new TurnId(UUID.fromString(val));
  }

  @Override
  public String toString() {
    return value.toString();
  }
}
