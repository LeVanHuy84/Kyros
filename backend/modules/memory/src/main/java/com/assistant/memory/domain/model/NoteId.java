package com.assistant.memory.domain.model;

import java.util.Objects;
import java.util.UUID;

public record NoteId(UUID value) {
  public NoteId {
    Objects.requireNonNull(value, "Note ID value cannot be null");
  }

  public static NoteId random() {
    return new NoteId(UUID.randomUUID());
  }

  public static NoteId fromString(String val) {
    return new NoteId(UUID.fromString(val));
  }

  @Override
  public String toString() {
    return value.toString();
  }
}
