package com.assistant.auth.application.ports.in;

public interface AuthenticateUserUseCase {

  record AuthenticationResult(
      String accessToken, String refreshToken, String tokenType, long expiresIn) {}

  AuthenticationResult authenticate(String email, String rawPassword);
}
