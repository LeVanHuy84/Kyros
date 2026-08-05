package com.assistant.bootstrap.config;

import com.assistant.auth.application.ports.out.TokenRevocationCachePort;
import com.assistant.auth.presentation.security.JwtAuthenticationToken;
import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.exception.ServiceUnavailableException;
import com.assistant.workspace.application.ports.in.WorkspacePort;
import com.assistant.workspace.domain.Workspace;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final String secret;
  private final TokenRevocationCachePort tokenRevocationCache;
  private final WorkspacePort workspacePort;

  public JwtAuthenticationFilter(
      @Value(
              "${app.security.jwt.secret:super_secret_jwt_key_at_least_256_bits_long_super_secret_jwt_key_at_least_256_bits_long}")
          String secret,
      TokenRevocationCachePort tokenRevocationCache,
      WorkspacePort workspacePort) {
    this.secret = secret;
    this.tokenRevocationCache = tokenRevocationCache;
    this.workspacePort = workspacePort;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String authHeader = request.getHeader("Authorization");
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      filterChain.doFilter(request, response);
      return;
    }

    String token = authHeader.substring(7);
    try {
      SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
      Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();

      String jti = claims.getId();

      // Fail-closed check: if cache (Redis) throws ServiceUnavailableException, fail-closed
      if (tokenRevocationCache.isRevoked(jti)) {
        writeErrorResponse(
            response, HttpStatus.UNAUTHORIZED, "Unauthorized", "Token has been revoked");
        return;
      }

      String userIdStr = claims.getSubject();
      UserId userId = UserId.fromString(userIdStr);
      String roles = claims.get("roles", String.class);
      Date expiration = claims.getExpiration();

      List<SimpleGrantedAuthority> authorities =
          Collections.singletonList(
              new SimpleGrantedAuthority("ROLE_" + (roles != null ? roles : "EndUser")));

      JwtAuthenticationToken authentication =
          new JwtAuthenticationToken(userId, jti, expiration.toInstant(), authorities);
      SecurityContextHolder.getContext().setAuthentication(authentication);

      // Workspace Tenancy Scoping
      String xWorkspaceId = request.getHeader("X-Workspace-Id");
      if (xWorkspaceId != null && !xWorkspaceId.trim().isEmpty()) {
        WorkspaceContextHolder.set(new WorkspaceId(UUID.fromString(xWorkspaceId.trim())));
      } else {
        // Fallback: resolve user's primary workspace
        workspacePort
            .getPrimaryWorkspace(userId)
            .map(Workspace::getId)
            .ifPresent(WorkspaceContextHolder::set);
      }

      filterChain.doFilter(request, response);

    } catch (ServiceUnavailableException e) {
      // Fail-Closed policy: Redis offline -> Service Unavailable
      writeErrorResponse(
          response,
          HttpStatus.SERVICE_UNAVAILABLE,
          "Service Unavailable",
          "Session verification service is currently offline");
    } catch (JwtException | IllegalArgumentException e) {
      writeErrorResponse(
          response,
          HttpStatus.UNAUTHORIZED,
          "Unauthorized",
          "Invalid or expired authentication token");
    } finally {
      WorkspaceContextHolder.clear();
    }
  }

  private void writeErrorResponse(
      HttpServletResponse response, HttpStatus status, String title, String detail)
      throws IOException {
    response.setStatus(status.value());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);

    // RFC 7807 Problem Details shape
    String json =
        String.format(
            "{\"type\":\"about:blank\",\"title\":\"%s\",\"status\":%d,\"detail\":\"%s\"}",
            title, status.value(), detail);
    response.getWriter().write(json);
  }
}
