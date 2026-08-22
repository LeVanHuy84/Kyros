package com.assistant.memory.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataUserPreferencesRepository
    extends JpaRepository<UserPreferencesJpaEntity, UUID> {
  Optional<UserPreferencesJpaEntity> findByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);
}
