package com.assistant.auth.infrastructure.cache;

import com.assistant.auth.application.ports.out.RefreshTokenPort;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.exception.ServiceUnavailableException;
import java.time.Duration;
import java.util.Optional;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class RedisRefreshTokenAdapter implements RefreshTokenPort {

  private static final String KEY_PREFIX = "refresh_token:";
  private final StringRedisTemplate redisTemplate;

  public RedisRefreshTokenAdapter(StringRedisTemplate redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  @Override
  public void save(String refreshToken, UserId userId, Duration ttl) {
    String key = KEY_PREFIX + refreshToken;
    try {
      redisTemplate.opsForValue().set(key, userId.toString(), ttl);
    } catch (Exception e) {
      throw new ServiceUnavailableException("Redis is unreachable. Failed to save refresh token.", e);
    }
  }

  @Override
  public Optional<UserId> findUserIdByToken(String refreshToken) {
    String key = KEY_PREFIX + refreshToken;
    try {
      String userIdStr = redisTemplate.opsForValue().get(key);
      if (userIdStr == null) {
        return Optional.empty();
      }
      return Optional.of(UserId.fromString(userIdStr));
    } catch (Exception e) {
      throw new ServiceUnavailableException("Redis is unreachable. Failed to retrieve refresh token.", e);
    }
  }

  @Override
  public void revoke(String refreshToken) {
    String key = KEY_PREFIX + refreshToken;
    try {
      redisTemplate.delete(key);
    } catch (Exception e) {
      throw new ServiceUnavailableException("Redis is unreachable. Failed to revoke refresh token.", e);
    }
  }
}
