package com.assistant.notification.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringDataInAppNotificationRepository
    extends JpaRepository<InAppNotificationJpaEntity, UUID> {

  Optional<InAppNotificationJpaEntity> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

  List<InAppNotificationJpaEntity> findByWorkspaceIdAndUserIdAndStatusOrderByCreatedAtDesc(
      UUID workspaceId, UUID userId, String status);

  Page<InAppNotificationJpaEntity> findByWorkspaceIdAndUserIdAndStatus(
      UUID workspaceId, UUID userId, String status, Pageable pageable);

  Page<InAppNotificationJpaEntity> findByWorkspaceIdAndUserId(
      UUID workspaceId, UUID userId, Pageable pageable);

  long countByWorkspaceIdAndUserIdAndStatus(UUID workspaceId, UUID userId, String status);

  long countByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

  @Modifying
  @Query(
      "UPDATE InAppNotificationJpaEntity n SET n.status = 'Read', n.readAt = CURRENT_TIMESTAMP,"
          + " n.updatedAt = CURRENT_TIMESTAMP WHERE n.workspaceId = :workspaceId AND n.userId ="
          + " :userId AND n.status = 'Unread'")
  void markAllRead(@Param("workspaceId") UUID workspaceId, @Param("userId") UUID userId);
}
