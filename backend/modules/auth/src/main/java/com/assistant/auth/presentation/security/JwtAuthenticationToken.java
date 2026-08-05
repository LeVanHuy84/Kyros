package com.assistant.auth.presentation.security;

import com.assistant.kernel.domain.UserId;
import java.time.Instant;
import java.util.Collection;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

public class JwtAuthenticationToken extends AbstractAuthenticationToken {

  private final UserId userId;
  private final String jti;
  private final Instant expiration;

  public JwtAuthenticationToken(
      UserId userId,
      String jti,
      Instant expiration,
      Collection<? extends GrantedAuthority> authorities) {
    super(authorities);
    this.userId = userId;
    this.jti = jti;
    this.expiration = expiration;
    setAuthenticated(true);
  }

  @Override
  public Object getCredentials() {
    return jti;
  }

  @Override
  public Object getPrincipal() {
    return userId;
  }

  public String getJti() {
    return jti;
  }

  public Instant getExpiration() {
    return expiration;
  }
}
