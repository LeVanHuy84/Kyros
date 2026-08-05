package com.assistant.auth.application.ports.in;

public interface ResendVerificationUseCase {
  void resend(String email);
}
