package com.assistant.auth.application.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.assistant.auth.application.ports.out.EmailSenderPort;
import com.assistant.auth.application.ports.out.PasswordHasherPort;
import com.assistant.auth.application.ports.out.RefreshTokenPort;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

class AuthServiceTest {

  private FakeUserRepository userRepository;
  private FakeEmailVerificationTokenRepository tokenRepository;
  private FakePasswordHasher passwordHasher;
  private FakeTokenGenerator tokenGenerator;
  private FakeTokenRevocationCache tokenRevocationCache;
  private FakeRefreshTokenPort refreshTokenPort;
  private FakeEmailSender emailSender;
  private FakeEventPublisher eventPublisher;
  private AuthService authService;

  @BeforeEach
  void setUp() {
    userRepository = new FakeUserRepository();
    tokenRepository = new FakeEmailVerificationTokenRepository();
    passwordHasher = new FakePasswordHasher();
    tokenGenerator = new FakeTokenGenerator();
    tokenRevocationCache = new FakeTokenRevocationCache();
    refreshTokenPort = new FakeRefreshTokenPort();
    emailSender = new FakeEmailSender();
    eventPublisher = new FakeEventPublisher();
    authService =
        new AuthService(
            userRepository,
            tokenRepository,
            passwordHasher,
            tokenGenerator,
            tokenRevocationCache,
            refreshTokenPort,
            emailSender,
            eventPublisher);
  }

  @Test
  void shouldRegisterNewUserSuccessfully() {
    String email = "test@example.com";
    String password = "securePassword123";

    UserIdentity user = authService.register(email, password);

    assertNotNull(user);
    assertEquals("test@example.com", user.getEmail());
    assertEquals("hashed_" + password, user.getPasswordHash());
    assertEquals(AccountStatus.PendingVerification, user.getStatus());

    // Verify stored in repository
    assertTrue(userRepository.findById(user.getId()).isPresent());

    // Verify UserRegistered event published
    assertEquals(1, eventPublisher.publishedEvents.size());
    UserRegistered event = (UserRegistered) eventPublisher.publishedEvents.get(0);
    assertEquals(user.getId(), event.userId());
    assertEquals("test@example.com", event.email());

    // Verify verification token saved and email sent
    assertNotNull(emailSender.lastToken);
    assertEquals("test@example.com", emailSender.lastEmail);
    assertTrue(tokenRepository.findByToken(emailSender.lastToken).isPresent());
  }

  @Test
  void shouldFailRegisteringDuplicateEmail() {
    String email = "duplicate@example.com";
    authService.register(email, "password123");

    assertThrows(DomainException.class, () -> authService.register(email, "differentPassword"));
  }

  @Test
  void shouldAuthenticateUserSuccessfullyAfterVerification() {
    String email = "auth@example.com";
    String password = "myPassword";

    authService.register(email, password);

    // Verify before login
    String verificationToken = emailSender.lastToken;
    assertNotNull(verificationToken);

    // Attempt login before verifying should fail
    assertThrows(DomainException.class, () -> authService.authenticate(email, password));

    // Verify account
    authService.verify(verificationToken);

    // Login should succeed now
    var result = authService.authenticate(email, password);

    assertNotNull(result);
    assertEquals("Bearer", result.tokenType());
    assertEquals("token_auth@example.com", result.accessToken());

    UserIdentity verifiedUser = userRepository.findByEmail(email).orElseThrow();
    assertEquals(AccountStatus.Active, verifiedUser.getStatus());
  }

  @Test
  void shouldLockAccountAfter5FailedAttempts() {
    String email = "lock@example.com";
    String correctPassword = "correctPassword";
    authService.register(email, correctPassword);

    // Verify first
    authService.verify(emailSender.lastToken);

    // Fail 4 times
    for (int i = 0; i < 4; i++) {
      assertThrows(DomainException.class, () -> authService.authenticate(email, "wrongPassword"));
    }

    // Account should still be active
    UserIdentity user = userRepository.findByEmail(email).orElseThrow();
    assertEquals(4, user.getFailedLoginAttempts());
    assertEquals(AccountStatus.Active, user.getStatus());

    // Fail 5th time
    assertThrows(DomainException.class, () -> authService.authenticate(email, "wrongPassword"));
    assertEquals(5, user.getFailedLoginAttempts());
    assertEquals(AccountStatus.Locked, user.getStatus());

    // Try authenticating with correct password now
    DomainException exception =
        assertThrows(DomainException.class, () -> authService.authenticate(email, correctPassword));
    assertTrue(exception.getMessage().contains("locked"));
  }

  @Test
  void shouldResendVerificationTokenSuccessfully() {
    String email = "resend@example.com";
    authService.register(email, "password123");

    String firstToken = emailSender.lastToken;
    assertNotNull(firstToken);

    // Resend
    authService.resend(email);

    String secondToken = emailSender.lastToken;
    assertNotNull(secondToken);
    assertNotEquals(firstToken, secondToken);

    // Old token should be deleted
    assertFalse(tokenRepository.findByToken(firstToken).isPresent());
    assertTrue(tokenRepository.findByToken(secondToken).isPresent());

    // Verify with new token
    authService.verify(secondToken);
    UserIdentity user = userRepository.findByEmail(email).orElseThrow();
    assertEquals(AccountStatus.Active, user.getStatus());
  }

  @Test
  void shouldLogoutAndRevokeToken() {
    UserId userId = UserId.random();
    String jti = "jwt-id-123";
    Duration validity = Duration.ofMinutes(30);

    authService.logout(userId, jti, validity);

    assertTrue(tokenRevocationCache.isRevoked(jti));
    assertEquals(1, userRepository.sessionEvents.size());
    SessionEvent event = userRepository.sessionEvents.get(0);
    assertEquals(userId, event.getUserId());
    assertEquals(jti, event.getJti());
    assertEquals("Logout", event.getEventType());
  }

  // FAKES IMPLEMENTATIONS

  private static class FakeUserRepository implements UserRepository {
    private final Map<UserId, UserIdentity> users = new HashMap<>();
    private final List<SessionEvent> sessionEvents = new ArrayList<>();

    @Override
    public UserIdentity save(UserIdentity user) {
      users.put(user.getId(), user);
      return user;
    }

    @Override
    public Optional<UserIdentity> findById(UserId id) {
      return Optional.ofNullable(users.get(id));
    }

    @Override
    public Optional<UserIdentity> findByEmail(String email) {
      return users.values().stream().filter(u -> u.getEmail().equalsIgnoreCase(email)).findFirst();
    }

    @Override
    public void saveSessionEvent(SessionEvent event) {
      sessionEvents.add(event);
    }
  }

  private static class FakeEmailVerificationTokenRepository
      implements EmailVerificationTokenRepository {
    private final Map<UUID, EmailVerificationToken> tokens = new HashMap<>();

    @Override
    public EmailVerificationToken save(EmailVerificationToken token) {
      tokens.put(token.getId(), token);
      return token;
    }

    @Override
    public Optional<EmailVerificationToken> findByToken(String token) {
      return tokens.values().stream().filter(t -> t.getToken().equals(token)).findFirst();
    }

    @Override
    public Optional<EmailVerificationToken> findByUserId(UserId userId) {
      return tokens.values().stream().filter(t -> t.getUserId().equals(userId)).findFirst();
    }

    @Override
    public void delete(EmailVerificationToken token) {
      tokens.remove(token.getId());
    }

    @Override
    public void deleteByUserId(UserId userId) {
      tokens.values().removeIf(t -> t.getUserId().equals(userId));
    }
  }

  private static class FakePasswordHasher implements PasswordHasherPort {
    @Override
    public String hash(String rawPassword) {
      return "hashed_" + rawPassword;
    }

    @Override
    public boolean matches(String rawPassword, String hashed) {
      return hashed.equals("hashed_" + rawPassword);
    }
  }

  private static class FakeTokenGenerator implements TokenGeneratorPort {
    @Override
    public GeneratedToken generateToken(UserIdentity user) {
      return new GeneratedToken("token_" + user.getEmail(), "jti_" + user.getId(), 3600);
    }
  }

  private static class FakeTokenRevocationCache implements TokenRevocationCachePort {
    private final Set<String> revokedJtis = new HashSet<>();

    @Override
    public void revoke(String jti, Duration remainingValidity) {
      revokedJtis.add(jti);
    }

    @Override
    public boolean isRevoked(String jti) {
      return revokedJtis.contains(jti);
    }
  }

  private static class FakeEmailSender implements EmailSenderPort {
    private String lastEmail;
    private String lastToken;

    @Override
    public void sendVerificationEmail(String email, String token) {
      this.lastEmail = email;
      this.lastToken = token;
    }
  }

  private static class FakeEventPublisher implements ApplicationEventPublisher {
    private final List<Object> publishedEvents = new ArrayList<>();

    @Override
    public void publishEvent(Object event) {
      publishedEvents.add(event);
    }
  }

  private static class FakeRefreshTokenPort implements RefreshTokenPort {
    private final Map<String, UserId> tokenMap = new HashMap<>();

    @Override
    public void save(String refreshToken, UserId userId, Duration ttl) {
      tokenMap.put(refreshToken, userId);
    }

    @Override
    public Optional<UserId> findUserIdByToken(String refreshToken) {
      return Optional.ofNullable(tokenMap.get(refreshToken));
    }

    @Override
    public void revoke(String refreshToken) {
      tokenMap.remove(refreshToken);
    }
  }

  @Test
  void shouldRefreshTokenSuccessfully() {
    String email = "refresh_test@example.com";
    String password = "myPassword";

    authService.register(email, password);
    authService.verify(emailSender.lastToken);

    var loginResult = authService.authenticate(email, password);
    String refreshToken = loginResult.refreshToken();
    assertNotNull(refreshToken);

    var refreshResult = authService.refresh(refreshToken);
    assertNotNull(refreshResult);
    assertNotEquals(refreshToken, refreshResult.refreshToken());
    assertEquals("Bearer", refreshResult.tokenType());
    assertEquals("token_" + email, refreshResult.accessToken());

    // Old token should be revoked
    assertThrows(DomainException.class, () -> authService.refresh(refreshToken));
  }
}
