package com.assistant.auth.infrastructure.security;

import com.assistant.auth.application.ports.out.PasswordHasherPort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class BCryptPasswordHasher implements PasswordHasherPort {

  private final BCryptPasswordEncoder encoder;

  public BCryptPasswordHasher() {
    this.encoder = new BCryptPasswordEncoder();
  }

  @Override
  public String hash(String rawPassword) {
    return encoder.encode(rawPassword);
  }

  @Override
  public boolean matches(String rawPassword, String hashed) {
    return encoder.matches(rawPassword, hashed);
  }
}
