package com.assistant.notification.domain.repository;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.notification.domain.model.InAppNotification;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InAppNotificationRepository {
  void save(InAppNotification notification);

  Optional<InAppNotification> findById(UUID id, WorkspaceId workspaceId);

  List<InAppNotification> findActiveNotificationsForUser(WorkspaceId workspaceId, UserId userId);

  List<InAppNotification> findNotifications(
      WorkspaceId workspaceId, UserId userId, String statusFilter, int offset, int limit);

  long countNotifications(WorkspaceId workspaceId, UserId userId, String statusFilter);

  void markAllRead(WorkspaceId workspaceId, UserId userId);
}
