package com.assistant.auth.application.services;

import com.assistant.auth.application.ports.in.AuthenticateUserUseCase;
import com.assistant.auth.application.ports.in.LogoutUseCase;
import com.assistant.auth.application.ports.in.RegisterUserUseCase;
import com.assistant.auth.application.ports.in.ResendVerificationUseCase;
import com.assistant.auth.application.ports.in.VerifyEmailUseCase;
import com.assistant.auth.application.ports.out.EmailSenderPort;
import com.assistant.auth.application.ports.out.PasswordHasherPort;
import com.assistant.auth.application.ports.out.TokenGeneratorPort;
import com.assistant.auth.application.ports.out.TokenRevocationCachePort;
import com.assistant.auth.domain.AccountStatus;
import com.assistant.auth.domain.EmailVerificationToken;
import com.assistant.auth.domain.EmailVerificationTokenRepository;
import com.assistant.auth.domain.SessionEvent;
import com.assistant.auth.domain.UserIdentity;
import com.assistant.auth.domain.UserRepository;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.event.UserRegistered;
import com.assistant.kernel.exception.DomainException;
import java.time.Duration;
import java.time.Instant;
import com.assistant.auth.application.ports.in.RefreshTokenUseCase;
import com.assistant.auth.application.ports.out.RefreshTokenPort;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService
    implements RegisterUserUseCase,
        AuthenticateUserUseCase,
        LogoutUseCase,
        VerifyEmailUseCase,
        ResendVerificationUseCase,
        RefreshTokenUseCase {

  private final UserRepository userRepository;
  private final EmailVerificationTokenRepository tokenRepository;
  private final PasswordHasherPort passwordHasher;
  private final TokenGeneratorPort tokenGenerator;
  private final TokenRevocationCachePort tokenRevocationCache;
  private final RefreshTokenPort refreshTokenPort;
  private final EmailSenderPort emailSender;
  private final ApplicationEventPublisher eventPublisher;

  public AuthService(
      UserRepository userRepository,
      EmailVerificationTokenRepository tokenRepository,
      PasswordHasherPort passwordHasher,
      TokenGeneratorPort tokenGenerator,
      TokenRevocationCachePort tokenRevocationCache,
      RefreshTokenPort refreshTokenPort,
      EmailSenderPort emailSender,
      ApplicationEventPublisher eventPublisher) {
    this.userRepository = userRepository;
    this.tokenRepository = tokenRepository;
    this.passwordHasher = passwordHasher;
    this.tokenGenerator = tokenGenerator;
    this.tokenRevocationCache = tokenRevocationCache;
    this.refreshTokenPort = refreshTokenPort;
    this.emailSender = emailSender;
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

    // 1. Publish event for workspace provisioning (synchronous default)
    eventPublisher.publishEvent(new UserRegistered(userId, normalizedEmail));

    // 2. Generate and save verification token (expires in 1 hour)
    String tokenValue = java.util.UUID.randomUUID().toString();
    EmailVerificationToken token =
        new EmailVerificationToken(userId, tokenValue, Instant.now().plus(Duration.ofHours(1)));
    tokenRepository.save(token);

    // 3. Dispatch verification email via adapter
    emailSender.sendVerificationEmail(normalizedEmail, tokenValue);

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

    if (user.getStatus() == AccountStatus.PendingVerification) {
      throw new DomainException("Email is not verified. Please verify your email.");
    }
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
    String refreshToken = UUID.randomUUID().toString();
    refreshTokenPort.save(refreshToken, user.getId(), Duration.ofDays(7));

    return new AuthenticationResult(token.token(), refreshToken, "Bearer", token.expiresIn());
  }

  @Override
  @Transactional
  public AuthenticationResult refresh(String refreshToken) {
    UserId userId =
        refreshTokenPort
            .findUserIdByToken(refreshToken)
            .orElseThrow(() -> new DomainException("Invalid or expired refresh token"));

    UserIdentity user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new DomainException("User not found"));

    // Revoke old refresh token (rotation policy)
    refreshTokenPort.revoke(refreshToken);

    // Generate new tokens
    TokenGeneratorPort.GeneratedToken token = tokenGenerator.generateToken(user);
    String newRefreshToken = UUID.randomUUID().toString();
    refreshTokenPort.save(newRefreshToken, user.getId(), Duration.ofDays(7));

    return new AuthenticationResult(token.token(), newRefreshToken, "Bearer", token.expiresIn());
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

  @Override
  @Transactional
  public void verify(String tokenValue) {
    EmailVerificationToken token =
        tokenRepository
            .findByToken(tokenValue)
            .orElseThrow(() -> new DomainException("Invalid or expired verification token"));

    if (token.isExpired()) {
      throw new DomainException("Verification token has expired. Please request a new one.");
    }

    UserIdentity user =
        userRepository
            .findById(token.getUserId())
            .orElseThrow(() -> new DomainException("User associated with token not found"));

    user.verifyEmail();
    userRepository.save(user);

    // Delete token after successful validation
    tokenRepository.delete(token);
  }

  @Override
  @Transactional
  public void resend(String email) {
    String normalizedEmail = email.trim().toLowerCase(java.util.Locale.ROOT);
    UserIdentity user =
        userRepository
            .findByEmail(normalizedEmail)
            .orElseThrow(() -> new DomainException("No user found with the given email address"));

    if (user.getStatus() != AccountStatus.PendingVerification) {
      throw new DomainException("Account is already verified or cannot be verified");
    }

    // Delete any existing token for this user to avoid duplication
    tokenRepository.deleteByUserId(user.getId());

    // Generate new token (expires in 1 hour)
    String tokenValue = java.util.UUID.randomUUID().toString();
    EmailVerificationToken token =
        new EmailVerificationToken(
            user.getId(), tokenValue, Instant.now().plus(Duration.ofHours(1)));
    tokenRepository.save(token);

    // Resend mail
    emailSender.sendVerificationEmail(normalizedEmail, tokenValue);
  }
}
