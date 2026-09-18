package com.assistant.agent.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpringDataUserAiConfigRepository
    extends JpaRepository<UserAiConfigJpaEntity, UUID> {

  Optional<UserAiConfigJpaEntity> findByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);
}
