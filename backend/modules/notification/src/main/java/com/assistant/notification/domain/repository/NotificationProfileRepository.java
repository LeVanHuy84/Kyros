package com.assistant.notification.domain.repository;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.notification.domain.model.NotificationProfile;
import java.util.Optional;

public interface NotificationProfileRepository {
  void save(NotificationProfile profile);

  Optional<NotificationProfile> findByCompositeKey(WorkspaceId workspaceId, UserId userId);
}
