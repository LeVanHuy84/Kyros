package com.assistant.memory.domain.repository;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.UserPreferences;
import java.util.Optional;

public interface UserPreferencesRepository {
  Optional<UserPreferences> find(WorkspaceId workspaceId, UserId userId);

  void save(UserPreferences preferences);
}
