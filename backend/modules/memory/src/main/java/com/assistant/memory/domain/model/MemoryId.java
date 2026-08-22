package com.assistant.memory.domain.model;

import java.util.Objects;
import java.util.UUID;

public record MemoryId(UUID value) {
  public MemoryId {
    Objects.requireNonNull(value, "Memory ID value cannot be null");
  }

  public static MemoryId random() {
    return new MemoryId(UUID.randomUUID());
  }

  public static MemoryId fromString(String val) {
    return new MemoryId(UUID.fromString(val));
  }

  @Override
  public String toString() {
    return value.toString();
  }
}
