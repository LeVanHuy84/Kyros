package com.assistant.auth.presentation.dto;

import com.assistant.auth.domain.UserIdentity;
import java.util.UUID;

public record UserResponse(UUID id, String email, String status, String globalRoles) {

  public static UserResponse fromDomain(UserIdentity user) {
    return new UserResponse(
        user.getId().value(), user.getEmail(), user.getStatus().name(), user.getGlobalRoles());
  }
}
