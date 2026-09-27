package com.assistant.memory.infrastructure.persistence;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.CoreUserProfile;
import com.assistant.memory.domain.repository.CoreUserProfileRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class CoreUserProfileRepositoryAdapter implements CoreUserProfileRepository {

  private final SpringDataCoreUserProfileRepository repository;

  public CoreUserProfileRepositoryAdapter(SpringDataCoreUserProfileRepository repository) {
    this.repository = repository;
  }

  @Override
  public Optional<CoreUserProfile> findByUser(WorkspaceId workspaceId, UserId userId) {
    return repository
        .findByWorkspaceIdAndUserId(workspaceId.value(), userId.value())
        .map(this::toDomain);
  }

  @Override
  public void save(CoreUserProfile profile) {
    Optional<CoreUserProfileJpaEntity> existing =
        repository.findByWorkspaceIdAndUserId(
            profile.getWorkspaceId().value(), profile.getUserId().value());

    CoreUserProfileJpaEntity jpa;
    if (existing.isPresent()) {
      jpa = existing.get();
      jpa.setMarkdownContent(profile.getMarkdownContent());
      jpa.setLastSynthesizedAt(profile.getLastSynthesizedAt());
      jpa.setFactCount(profile.getFactCount());
      jpa.setUpdatedAt(profile.getUpdatedAt());
    } else {
      jpa = new CoreUserProfileJpaEntity();
      jpa.setId(UUID.randomUUID());
      jpa.setWorkspaceId(profile.getWorkspaceId().value());
      jpa.setUserId(profile.getUserId().value());
      jpa.setMarkdownContent(profile.getMarkdownContent());
      jpa.setLastSynthesizedAt(profile.getLastSynthesizedAt());
      jpa.setFactCount(profile.getFactCount());
      jpa.setCreatedAt(profile.getCreatedAt());
      jpa.setUpdatedAt(profile.getUpdatedAt());
      jpa.setVersion(0);
    }
    repository.save(jpa);
  }

  private CoreUserProfile toDomain(CoreUserProfileJpaEntity jpa) {
    return new CoreUserProfile(
        new WorkspaceId(jpa.getWorkspaceId()),
        new UserId(jpa.getUserId()),
        jpa.getMarkdownContent(),
        jpa.getLastSynthesizedAt(),
        jpa.getFactCount(),
        jpa.getCreatedAt(),
        jpa.getUpdatedAt(),
        jpa.getVersion());
  }
}
