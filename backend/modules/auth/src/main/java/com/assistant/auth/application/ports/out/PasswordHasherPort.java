package com.assistant.auth.application.ports.out;

public interface PasswordHasherPort {

  String hash(String rawPassword);

  boolean matches(String rawPassword, String hashed);
}
