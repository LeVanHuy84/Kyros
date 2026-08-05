package com.assistant.auth.application.ports.out;

import java.time.Duration;

public interface TokenRevocationCachePort {

  void revoke(String jti, Duration remainingValidity);

  boolean isRevoked(String jti);
}
