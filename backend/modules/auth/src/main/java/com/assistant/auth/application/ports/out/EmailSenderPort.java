package com.assistant.auth.application.ports.out;

public interface EmailSenderPort {
  void sendVerificationEmail(String email, String token);

  void sendPasswordResetEmail(String email, String token);
}
