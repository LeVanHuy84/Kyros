package com.assistant.bootstrap.document;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class WorkspaceDocumentRepositoryAdapter implements WorkspaceDocumentRepository {

  private final SpringDataWorkspaceDocumentRepository springDataRepository;

  public WorkspaceDocumentRepositoryAdapter(
      SpringDataWorkspaceDocumentRepository springDataRepository) {
    this.springDataRepository = springDataRepository;
  }

  @Override
  public WorkspaceDocumentJpaEntity save(WorkspaceDocumentJpaEntity entity) {
    return springDataRepository.save(entity);
  }

  @Override
  public List<WorkspaceDocumentJpaEntity> findByWorkspaceId(UUID workspaceId) {
    return springDataRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
  }

  @Override
  public Optional<WorkspaceDocumentJpaEntity> findByIdAndWorkspaceId(UUID id, UUID workspaceId) {
    return springDataRepository.findByIdAndWorkspaceId(id, workspaceId);
  }

  @Override
  public void delete(UUID id, UUID workspaceId) {
    springDataRepository.deleteByIdAndWorkspaceId(id, workspaceId);
  }
}
