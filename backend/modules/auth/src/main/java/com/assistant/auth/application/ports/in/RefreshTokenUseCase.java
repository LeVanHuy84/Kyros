package com.assistant.auth.application.ports.in;

public interface RefreshTokenUseCase {
  AuthenticateUserUseCase.AuthenticationResult refresh(String refreshToken);
}
