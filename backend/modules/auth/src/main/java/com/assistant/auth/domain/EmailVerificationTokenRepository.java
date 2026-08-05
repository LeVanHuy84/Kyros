package com.assistant.auth.domain;

import com.assistant.kernel.domain.UserId;
import java.util.Optional;

public interface EmailVerificationTokenRepository {
  EmailVerificationToken save(EmailVerificationToken token);

  Optional<EmailVerificationToken> findByToken(String token);

  Optional<EmailVerificationToken> findByUserId(UserId userId);

  void delete(EmailVerificationToken token);

  void deleteByUserId(UserId userId);
}
