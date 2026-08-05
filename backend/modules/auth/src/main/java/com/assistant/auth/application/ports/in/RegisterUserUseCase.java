package com.assistant.auth.application.ports.in;

import com.assistant.auth.domain.UserIdentity;

public interface RegisterUserUseCase {

  UserIdentity register(String email, String rawPassword);
}
