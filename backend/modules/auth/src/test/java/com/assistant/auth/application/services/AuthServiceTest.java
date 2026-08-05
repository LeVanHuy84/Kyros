package com.assistant.auth.application.services;

import static org.junit.jupiter.api.Assertions.*;

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
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

class AuthServiceTest {

  private FakeUserRepository userRepository;
  private FakePasswordHasher passwordHasher;
  private FakeTokenGenerator tokenGenerator;
  private FakeTokenRevocationCache tokenRevocationCache;
  private FakeEventPublisher eventPublisher;
  private AuthService authService;

  @BeforeEach
  void setUp() {
    userRepository = new FakeUserRepository();
    passwordHasher = new FakePasswordHasher();
    tokenGenerator = new FakeTokenGenerator();
    tokenRevocationCache = new FakeTokenRevocationCache();
    eventPublisher = new FakeEventPublisher();
    authService =
        new AuthService(
            userRepository, passwordHasher, tokenGenerator, tokenRevocationCache, eventPublisher);
  }

  @Test
  void shouldRegisterNewUserSuccessfully() {
    String email = "test@example.com";
    String password = "securePassword123";

    UserIdentity user = authService.register(email, password);

    assertNotNull(user);
    assertEquals("test@example.com", user.getEmail());
    assertEquals("hashed_" + password, user.getPasswordHash());
    assertEquals(AccountStatus.Active, user.getStatus());

    // Verify stored in repository
    assertTrue(userRepository.findById(user.getId()).isPresent());

    // Verify UserRegistered event published
    assertEquals(1, eventPublisher.publishedEvents.size());
    UserRegistered event = (UserRegistered) eventPublisher.publishedEvents.get(0);
    assertEquals(user.getId(), event.userId());
    assertEquals("test@example.com", event.email());
  }

  @Test
  void shouldFailRegisteringDuplicateEmail() {
    String email = "duplicate@example.com";
    authService.register(email, "password123");

    assertThrows(DomainException.class, () -> authService.register(email, "differentPassword"));
  }

  @Test
  void shouldAuthenticateUserSuccessfully() {
    String email = "auth@example.com";
    String password = "myPassword";

    authService.register(email, password);

    var result = authService.authenticate(email, password);

    assertNotNull(result);
    assertEquals("Bearer", result.tokenType());
    assertEquals("token_auth@example.com", result.accessToken());
  }

  @Test
  void shouldLockAccountAfter5FailedAttempts() {
    String email = "lock@example.com";
    String correctPassword = "correctPassword";
    authService.register(email, correctPassword);

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

  private static class FakeEventPublisher implements ApplicationEventPublisher {
    private final List<Object> publishedEvents = new ArrayList<>();

    @Override
    public void publishEvent(Object event) {
      publishedEvents.add(event);
    }
  }
}
