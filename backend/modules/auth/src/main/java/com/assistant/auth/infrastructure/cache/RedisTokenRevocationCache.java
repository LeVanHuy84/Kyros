package com.assistant.auth.infrastructure.cache;

import com.assistant.auth.application.ports.out.TokenRevocationCachePort;
import com.assistant.kernel.exception.ServiceUnavailableException;
import java.time.Duration;
import java.util.Objects;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class RedisTokenRevocationCache implements TokenRevocationCachePort {

  private static final String KEY_PREFIX = "revoked:";
  private final StringRedisTemplate redisTemplate;

  public RedisTokenRevocationCache(StringRedisTemplate redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  @Override
  public void revoke(String jti, Duration remainingValidity) {
    Objects.requireNonNull(jti, "jti cannot be null");
    String key = KEY_PREFIX + jti;
    try {
      redisTemplate.opsForValue().set(key, "true", remainingValidity);
    } catch (Exception e) {
      throw new ServiceUnavailableException(
          "Redis is unreachable. Failed to write revocation key.", e);
    }
  }

  @Override
  public boolean isRevoked(String jti) {
    if (jti == null) {
      return false;
    }
    String key = KEY_PREFIX + jti;
    try {
      Boolean exists = redisTemplate.hasKey(key);
      return exists != null && exists;
    } catch (Exception e) {
      throw new ServiceUnavailableException(
          "Redis is unreachable. Failed to verify token validity.", e);
    }
  }
}
