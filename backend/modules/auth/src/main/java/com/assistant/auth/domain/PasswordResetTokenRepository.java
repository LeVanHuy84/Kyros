package com.assistant.auth.domain;

import com.assistant.kernel.domain.UserId;
import java.util.Optional;

public interface PasswordResetTokenRepository {
  PasswordResetToken save(PasswordResetToken token);

  Optional<PasswordResetToken> findByToken(String token);

  Optional<PasswordResetToken> findByUserId(UserId userId);

  void delete(PasswordResetToken token);

  void deleteByUserId(UserId userId);
}
