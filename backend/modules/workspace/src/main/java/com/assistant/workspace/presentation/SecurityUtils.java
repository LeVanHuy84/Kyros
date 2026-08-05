package com.assistant.workspace.presentation;

import com.assistant.kernel.domain.UserId;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

  private SecurityUtils() {}

  public static UserId getCurrentUserId() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
      throw new IllegalStateException("User is not authenticated");
    }
    Object principal = auth.getPrincipal();
    if (principal instanceof UserId userId) {
      return userId;
    } else if (principal instanceof String str) {
      return UserId.fromString(str);
    } else if (principal instanceof UUID uuid) {
      return new UserId(uuid);
    }
    throw new IllegalStateException("Unknown principal type: " + principal.getClass());
  }
}
