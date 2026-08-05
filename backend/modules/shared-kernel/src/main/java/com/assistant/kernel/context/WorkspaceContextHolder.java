package com.assistant.kernel.context;

import com.assistant.kernel.domain.WorkspaceId;
import java.util.Optional;

public final class WorkspaceContextHolder {

  private static final ThreadLocal<WorkspaceId> CONTEXT = new ThreadLocal<>();

  private WorkspaceContextHolder() {}

  public static void set(WorkspaceId workspaceId) {
    CONTEXT.set(workspaceId);
  }

  public static Optional<WorkspaceId> get() {
    return Optional.ofNullable(CONTEXT.get());
  }

  public static WorkspaceId getRequired() {
    return get()
        .orElseThrow(
            () -> new IllegalStateException("No active workspace context set for this thread"));
  }

  public static void clear() {
    CONTEXT.remove();
  }
}
