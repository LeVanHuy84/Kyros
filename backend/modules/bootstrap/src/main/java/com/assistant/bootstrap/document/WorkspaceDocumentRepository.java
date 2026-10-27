package com.assistant.bootstrap.document;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceDocumentRepository {

  WorkspaceDocumentJpaEntity save(WorkspaceDocumentJpaEntity entity);

  List<WorkspaceDocumentJpaEntity> findByWorkspaceId(UUID workspaceId);

  Optional<WorkspaceDocumentJpaEntity> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

  void delete(UUID id, UUID workspaceId);
}
