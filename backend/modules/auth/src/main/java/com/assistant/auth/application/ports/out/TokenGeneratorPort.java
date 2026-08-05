package com.assistant.auth.application.ports.out;

import com.assistant.auth.domain.UserIdentity;

public interface TokenGeneratorPort {

  record GeneratedToken(String token, String jti, long expiresIn) {}

  GeneratedToken generateToken(UserIdentity user);
}
