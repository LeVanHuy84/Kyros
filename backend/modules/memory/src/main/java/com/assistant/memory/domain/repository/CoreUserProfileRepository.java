package com.assistant.memory.domain.repository;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.CoreUserProfile;
import java.util.Optional;

public interface CoreUserProfileRepository {
  Optional<CoreUserProfile> findByUser(WorkspaceId workspaceId, UserId userId);

  void save(CoreUserProfile profile);
}
