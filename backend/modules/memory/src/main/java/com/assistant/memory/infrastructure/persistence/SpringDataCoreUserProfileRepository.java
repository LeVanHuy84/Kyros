package com.assistant.memory.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataCoreUserProfileRepository
    extends JpaRepository<CoreUserProfileJpaEntity, UUID> {
  Optional<CoreUserProfileJpaEntity> findByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);
}
