package com.assistant.auth.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataEmailVerificationTokenRepository
    extends JpaRepository<EmailVerificationTokenJpaEntity, UUID> {
  Optional<EmailVerificationTokenJpaEntity> findByToken(String token);

  Optional<EmailVerificationTokenJpaEntity> findByUserId(UUID userId);

  void deleteByUserId(UUID userId);
}
