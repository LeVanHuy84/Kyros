package com.assistant.auth.application.services;

import com.assistant.auth.application.ports.in.AuthenticateUserUseCase;
import com.assistant.auth.application.ports.in.LogoutUseCase;
import com.assistant.auth.application.ports.in.RegisterUserUseCase;
import com.assistant.auth.application.ports.out.PasswordHasherPort;
import com.assistant.auth.application.ports.out.TokenGeneratorPort;
import com.assistant.auth.application.ports.out.TokenRevocationCachePort;
import com.assistant.auth.domain.AccountStatus;
import com.assistant.auth.domain.SessionEvent;
import com.assistant.auth.domain.UserIdentity;
import com.assistant.auth.domain.UserRepository;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.event.UserRegistered;
import com.assistant.kernel.exception.DomainException;
import java.time.Duration;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService implements RegisterUserUseCase, AuthenticateUserUseCase, LogoutUseCase {

  private final UserRepository userRepository;
  private final PasswordHasherPort passwordHasher;
  private final TokenGeneratorPort tokenGenerator;
  private final TokenRevocationCachePort tokenRevocationCache;
  private final ApplicationEventPublisher eventPublisher;

  public AuthService(
      UserRepository userRepository,
      PasswordHasherPort passwordHasher,
      TokenGeneratorPort tokenGenerator,
      TokenRevocationCachePort tokenRevocationCache,
      ApplicationEventPublisher eventPublisher) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenGenerator = tokenGenerator;
    this.tokenRevocationCache = tokenRevocationCache;
    this.eventPublisher = eventPublisher;
  }

  @Override
  @Transactional
  public UserIdentity register(String email, String rawPassword) {
    String normalizedEmail = email.trim().toLowerCase(java.util.Locale.ROOT);
    if (userRepository.findByEmail(normalizedEmail).isPresent()) {
      throw new DomainException("Email is already registered");
    }

    String hashedPassword = passwordHasher.hash(rawPassword);
    UserId userId = UserId.random();
    UserIdentity user = new UserIdentity(userId, normalizedEmail, hashedPassword);
    UserIdentity savedUser = userRepository.save(user);

    // Publish event for workspace provisioning
    eventPublisher.publishEvent(new UserRegistered(userId, normalizedEmail));

    return savedUser;
  }

  @Override
  @Transactional
  public AuthenticationResult authenticate(String email, String rawPassword) {
    String normalizedEmail = email.trim().toLowerCase(java.util.Locale.ROOT);
    UserIdentity user =
        userRepository
            .findByEmail(normalizedEmail)
            .orElseThrow(() -> new DomainException("Invalid email or password"));

    if (user.getStatus() == AccountStatus.Locked) {
      throw new DomainException("Account is locked due to too many failed login attempts");
    }
    if (user.getStatus() == AccountStatus.Suspended) {
      throw new DomainException("Account is suspended");
    }

    if (!passwordHasher.matches(rawPassword, user.getPasswordHash())) {
      user.recordLoginFailure();
      userRepository.save(user);
      throw new DomainException("Invalid email or password");
    }

    user.recordLoginSuccess();
    userRepository.save(user);

    TokenGeneratorPort.GeneratedToken token = tokenGenerator.generateToken(user);
    return new AuthenticationResult(token.token(), "Bearer", token.expiresIn());
  }

  @Override
  @Transactional
  public void logout(UserId userId, String jti, Duration remainingValidity) {
    if (jti != null && !remainingValidity.isNegative() && !remainingValidity.isZero()) {
      // 1. Write key to Redis deny-list
      tokenRevocationCache.revoke(jti, remainingValidity);

      // 2. Append postgres audit log
      SessionEvent event = new SessionEvent(userId, jti, "Logout", "User logged out");
      userRepository.saveSessionEvent(event);
    }
  }
}
