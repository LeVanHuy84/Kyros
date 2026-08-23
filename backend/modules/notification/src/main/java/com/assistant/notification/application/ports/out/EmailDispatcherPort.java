package com.assistant.notification.application.ports.out;

public interface EmailDispatcherPort {
  void sendEmail(String toEmail, String subject, String renderedBody);
}
