package com.assistant.memory.domain.service;

public record SensitiveDataScreeningResult(Status status, String reason) {
  public enum Status {
    ALLOWED,
    REJECTED
  }

  public static SensitiveDataScreeningResult allowed() {
    return new SensitiveDataScreeningResult(Status.ALLOWED, "No sensitive data detected");
  }

  public static SensitiveDataScreeningResult rejected(String reason) {
    return new SensitiveDataScreeningResult(Status.REJECTED, reason);
  }

  public boolean isAllowed() {
    return status == Status.ALLOWED;
  }
}
