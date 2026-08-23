package com.assistant.notification.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataNotificationProfileRepository
    extends JpaRepository<NotificationProfileJpaEntity, UUID> {

  Optional<NotificationProfileJpaEntity> findByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);
}
