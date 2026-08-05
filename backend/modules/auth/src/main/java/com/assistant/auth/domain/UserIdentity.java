package com.assistant.auth.domain;

import com.assistant.kernel.domain.UserId;
import java.time.Instant;
import java.util.Objects;

public class UserIdentity {

  private final UserId id;
  private String email;
  private String passwordHash;
  private AccountStatus status;
  private int failedLoginAttempts;
  private String globalRoles;
  private final Instant createdAt;
  private Instant updatedAt;
  private int version;

  public UserIdentity(
      UserId id,
      String email,
      String passwordHash,
      AccountStatus status,
      int failedLoginAttempts,
      String globalRoles,
      Instant createdAt,
      Instant updatedAt,
      int version) {
    this.id = Objects.requireNonNull(id, "id cannot be null");
    setEmail(email);
    setPasswordHash(passwordHash);
    this.status = Objects.requireNonNull(status, "status cannot be null");
    this.failedLoginAttempts = failedLoginAttempts;
    this.globalRoles = Objects.requireNonNull(globalRoles, "globalRoles cannot be null");
    this.createdAt = Objects.requireNonNull(createdAt, "createdAt cannot be null");
    this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt cannot be null");
    this.version = version;
  }

  public UserIdentity(UserId id, String email, String passwordHash) {
    this(
        id,
        email,
        passwordHash,
        AccountStatus.Active,
        0,
        "EndUser",
        Instant.now(),
        Instant.now(),
        0);
  }

  public UserId getId() {
    return id;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    if (email == null || email.trim().isEmpty()) {
      throw new IllegalArgumentException("Email cannot be empty");
    }
    this.email = email.trim().toLowerCase(java.util.Locale.ROOT);
    this.updatedAt = Instant.now();
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    if (passwordHash == null || passwordHash.trim().isEmpty()) {
      throw new IllegalArgumentException("Password hash cannot be empty");
    }
    this.passwordHash = passwordHash;
    this.updatedAt = Instant.now();
  }

  public AccountStatus getStatus() {
    return status;
  }

  public int getFailedLoginAttempts() {
    return failedLoginAttempts;
  }

  public String getGlobalRoles() {
    return globalRoles;
  }

  public void setGlobalRoles(String globalRoles) {
    this.globalRoles = Objects.requireNonNull(globalRoles, "globalRoles cannot be null");
    this.updatedAt = Instant.now();
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public int getVersion() {
    return version;
  }

  public void recordLoginFailure() {
    if (this.status == AccountStatus.Active) {
      this.failedLoginAttempts++;
      if (this.failedLoginAttempts >= 5) {
        this.status = AccountStatus.Locked;
      }
      this.updatedAt = Instant.now();
    }
  }

  public void recordLoginSuccess() {
    if (this.status == AccountStatus.Active) {
      this.failedLoginAttempts = 0;
      this.updatedAt = Instant.now();
    }
  }

  public void unlockAccount() {
    this.status = AccountStatus.Active;
    this.failedLoginAttempts = 0;
    this.updatedAt = Instant.now();
  }

  public void suspendAccount() {
    this.status = AccountStatus.Suspended;
    this.updatedAt = Instant.now();
  }
}
