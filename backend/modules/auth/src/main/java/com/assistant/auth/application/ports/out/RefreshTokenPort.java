package com.assistant.auth.application.ports.out;

import com.assistant.kernel.domain.UserId;
import java.time.Duration;
import java.util.Optional;

public interface RefreshTokenPort {
  void save(String refreshToken, UserId userId, Duration ttl);

  Optional<UserId> findUserIdByToken(String refreshToken);

  void revoke(String refreshToken);
}
