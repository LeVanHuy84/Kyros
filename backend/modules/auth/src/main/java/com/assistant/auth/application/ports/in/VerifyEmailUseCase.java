package com.assistant.auth.application.ports.in;

public interface VerifyEmailUseCase {
  void verify(String token);
}
