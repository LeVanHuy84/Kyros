package com.assistant.agent.infrastructure.persistence;

import com.assistant.agent.domain.model.UserAiConfig;
import com.assistant.agent.domain.repository.UserAiConfigRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class UserAiConfigRepositoryAdapter implements UserAiConfigRepository {

  private final SpringDataUserAiConfigRepository repository;

  public UserAiConfigRepositoryAdapter(SpringDataUserAiConfigRepository repository) {
    this.repository = repository;
  }

  @Override
  public Optional<UserAiConfig> findByWorkspaceIdAndUserId(UUID workspaceId, UUID userId) {
    return repository.findByWorkspaceIdAndUserId(workspaceId, userId).map(this::toDomain);
  }

  @Override
  public UserAiConfig save(UserAiConfig config) {
    UserAiConfigJpaEntity entity = toJpaEntity(config);
    UserAiConfigJpaEntity saved = repository.save(entity);
    return toDomain(saved);
  }

  private UserAiConfig toDomain(UserAiConfigJpaEntity entity) {
    return new UserAiConfig(
        entity.getId(),
        entity.getWorkspaceId(),
        entity.getUserId(),
        entity.getProvider(),
        entity.getApiKeyEncrypted(),
        entity.getBaseUrl(),
        entity.getModel(),
        entity.getCreatedAt(),
        entity.getUpdatedAt());
  }

  private UserAiConfigJpaEntity toJpaEntity(UserAiConfig domain) {
    UserAiConfigJpaEntity entity =
        repository
            .findById(domain.getId())
            .orElseGet(
                () -> {
                  UserAiConfigJpaEntity newEntity = new UserAiConfigJpaEntity();
                  newEntity.setId(domain.getId());
                  newEntity.setCreatedAt(domain.getCreatedAt());
                  return newEntity;
                });

    entity.setWorkspaceId(domain.getWorkspaceId());
    entity.setUserId(domain.getUserId());
    entity.setProvider(domain.getProvider());
    entity.setApiKeyEncrypted(domain.getApiKeyEncrypted());
    entity.setBaseUrl(domain.getBaseUrl());
    entity.setModel(domain.getModel());
    entity.setUpdatedAt(domain.getUpdatedAt());

    return entity;
  }
}
