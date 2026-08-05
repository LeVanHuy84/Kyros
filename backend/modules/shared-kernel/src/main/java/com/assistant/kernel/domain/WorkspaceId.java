package com.assistant.kernel.domain;

import java.util.Objects;
import java.util.UUID;

public record WorkspaceId(UUID value) {
  public WorkspaceId {
    Objects.requireNonNull(value, "Workspace ID value cannot be null");
  }

  public static WorkspaceId random() {
    return new WorkspaceId(UUID.randomUUID());
  }

  public static WorkspaceId fromString(String value) {
    return new WorkspaceId(UUID.fromString(value));
  }

  @Override
  public String toString() {
    return value.toString();
  }
}
