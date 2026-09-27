package com.assistant.auth.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataPasswordResetTokenRepository
    extends JpaRepository<PasswordResetTokenJpaEntity, UUID> {
  Optional<PasswordResetTokenJpaEntity> findByToken(String token);

  Optional<PasswordResetTokenJpaEntity> findByUserId(UUID userId);

  void deleteByUserId(UUID userId);
}
