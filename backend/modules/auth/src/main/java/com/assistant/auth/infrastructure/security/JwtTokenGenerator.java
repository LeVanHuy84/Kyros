package com.assistant.auth.infrastructure.security;

import com.assistant.auth.application.ports.out.TokenGeneratorPort;
import com.assistant.auth.domain.UserIdentity;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenGenerator implements TokenGeneratorPort {

  private final String secret;
  private final long expirationMs;

  public JwtTokenGenerator(
      @Value(
              "${app.security.jwt.secret:super_secret_jwt_key_at_least_256_bits_long_super_secret_jwt_key_at_least_256_bits_long}")
          String secret,
      @Value("${app.security.jwt.expiration-ms:86400000}") // 24 hours
          long expirationMs) {
    this.secret = secret;
    this.expirationMs = expirationMs;
  }

  @Override
  public GeneratedToken generateToken(UserIdentity user) {
    String jti = UUID.randomUUID().toString();
    Instant now = Instant.now();
    Instant expiry = now.plusMillis(expirationMs);

    Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

    String token =
        Jwts.builder()
            .subject(user.getId().toString())
            .claim("email", user.getEmail())
            .claim("roles", user.getGlobalRoles())
            .id(jti)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(key)
            .compact();

    long expiresIn = expirationMs / 1000;
    return new GeneratedToken(token, jti, expiresIn);
  }
}
