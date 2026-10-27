package com.assistant.bootstrap.document;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpringDataWorkspaceDocumentRepository
    extends JpaRepository<WorkspaceDocumentJpaEntity, UUID> {

  List<WorkspaceDocumentJpaEntity> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);

  Optional<WorkspaceDocumentJpaEntity> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

  void deleteByIdAndWorkspaceId(UUID id, UUID workspaceId);
}
