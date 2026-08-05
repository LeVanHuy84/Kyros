package com.assistant.auth.presentation;

import com.assistant.auth.application.ports.in.AuthenticateUserUseCase;
import com.assistant.auth.application.ports.in.LogoutUseCase;
import com.assistant.auth.application.ports.in.RegisterUserUseCase;
import com.assistant.auth.domain.UserIdentity;
import com.assistant.auth.presentation.dto.AuthResponse;
import com.assistant.auth.presentation.dto.LoginRequest;
import com.assistant.auth.presentation.dto.RegisterUserRequest;
import com.assistant.auth.presentation.dto.UserResponse;
import com.assistant.auth.presentation.security.JwtAuthenticationToken;
import com.assistant.kernel.domain.UserId;
import jakarta.validation.Valid;
import java.time.Duration;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final RegisterUserUseCase registerUseCase;
  private final AuthenticateUserUseCase authenticateUseCase;
  private final LogoutUseCase logoutUseCase;

  public AuthController(
      RegisterUserUseCase registerUseCase,
      AuthenticateUserUseCase authenticateUseCase,
      LogoutUseCase logoutUseCase) {
    this.registerUseCase = registerUseCase;
    this.authenticateUseCase = authenticateUseCase;
    this.logoutUseCase = logoutUseCase;
  }

  @PostMapping("/register")
  public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterUserRequest request) {
    UserIdentity user = registerUseCase.register(request.email(), request.password());
    return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.fromDomain(user));
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    AuthenticateUserUseCase.AuthenticationResult result =
        authenticateUseCase.authenticate(request.email(), request.password());
    return ResponseEntity.ok(
        new AuthResponse(result.accessToken(), result.tokenType(), result.expiresIn()));
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth instanceof JwtAuthenticationToken jwtAuth) {
      Instant expiration = jwtAuth.getExpiration();
      Duration remaining = Duration.between(Instant.now(), expiration);
      logoutUseCase.logout((UserId) jwtAuth.getPrincipal(), jwtAuth.getJti(), remaining);
    }
    SecurityContextHolder.clearContext();
    return ResponseEntity.noContent().build();
  }
}
