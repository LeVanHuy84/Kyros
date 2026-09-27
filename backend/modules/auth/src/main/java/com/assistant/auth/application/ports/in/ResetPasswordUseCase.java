package com.assistant.auth.application.ports.in;

public interface ResetPasswordUseCase {
  void resetPassword(String token, String newPassword);
}
