package com.assistant.notification.infrastructure.adapter;

import com.assistant.notification.application.ports.out.EmailDispatcherPort;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
public class SmtpEmailDispatcher implements EmailDispatcherPort {

  private final JavaMailSender mailSender;

  public SmtpEmailDispatcher(ObjectProvider<JavaMailSender> mailSenderProvider) {
    this.mailSender = mailSenderProvider.getIfAvailable();
  }

  @Override
  public void sendEmail(String toEmail, String subject, String renderedBody) {
    if (mailSender == null) {
      System.out.printf(
          "[WARN] JavaMailSender not available. Email not sent. To: %s | Subject: %s | Body: %s%n",
          toEmail, subject, renderedBody);
      return;
    }

    try {
      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

      helper.setText(renderedBody, true); // Set content to HTML
      helper.setTo(toEmail);
      helper.setSubject(subject);
      helper.setFrom("no-reply@kyros.ai");

      mailSender.send(mimeMessage);
      System.out.printf("[INFO] HTML Email successfully sent to: %s via SMTP%n", toEmail);
    } catch (Exception e) {
      System.err.println("SMTP delivery failed to " + toEmail + ": " + e.getMessage());
      throw new RuntimeException("Email delivery failed", e);
    }
  }
}
