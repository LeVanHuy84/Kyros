package com.assistant.agent.domain.repository;

import com.assistant.agent.domain.model.UserAiConfig;
import java.util.Optional;
import java.util.UUID;

public interface UserAiConfigRepository {

  Optional<UserAiConfig> findByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

  UserAiConfig save(UserAiConfig config);
}
