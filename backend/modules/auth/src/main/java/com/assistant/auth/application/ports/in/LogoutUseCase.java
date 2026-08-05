package com.assistant.auth.application.ports.in;

import com.assistant.kernel.domain.UserId;
import java.time.Duration;

public interface LogoutUseCase {

  void logout(UserId userId, String jti, Duration remainingValidity);
}
