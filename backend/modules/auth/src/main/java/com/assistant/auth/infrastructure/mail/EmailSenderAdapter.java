package com.assistant.auth.infrastructure.mail;

import com.assistant.auth.application.ports.out.EmailSenderPort;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
public class EmailSenderAdapter implements EmailSenderPort {

  private static final Logger log = LoggerFactory.getLogger(EmailSenderAdapter.class);

  private final JavaMailSender mailSender;
  private final String frontendUrl;

  public EmailSenderAdapter(
      JavaMailSender mailSender,
      @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl) {
    this.mailSender = mailSender;
    this.frontendUrl = frontendUrl;
  }

  @Override
  public void sendVerificationEmail(String email, String token) {
    String verificationLink = frontendUrl + "/verify?token=" + token;
    try {
      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

      String htmlMsg =
          "<h3>Welcome to Kyros!</h3><p>Please verify your email address to activate your account"
              + " by clicking the link below:</p><p><a href=\""
              + verificationLink
              + "\">Verify My Email Address</a></p><p>This link is valid for 1 hour. If you didn't"
              + " request this email, please ignore it.</p>";

      helper.setText(htmlMsg, true);
      helper.setTo(email);
      helper.setSubject("Kyros - Verify Your Email Address");
      helper.setFrom("no-reply@assistant.ai");

      mailSender.send(mimeMessage);
      log.info("Successfully sent email verification link to {}", email);
    } catch (Exception e) {
      log.error("Failed to send email verification link to {}", email, e);
      throw new RuntimeException("Email delivery failed", e);
    }
  }
}
