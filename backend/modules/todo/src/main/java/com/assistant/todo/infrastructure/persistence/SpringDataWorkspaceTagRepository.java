package com.assistant.todo.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringDataWorkspaceTagRepository
    extends JpaRepository<WorkspaceTagJpaEntity, UUID> {

  List<WorkspaceTagJpaEntity> findAllByWorkspaceIdOrderByNameAsc(UUID workspaceId);

  Optional<WorkspaceTagJpaEntity> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

  boolean existsByNameIgnoreCaseAndWorkspaceId(String name, UUID workspaceId);

  @Modifying
  @Query("DELETE FROM WorkspaceTagJpaEntity t WHERE t.id = :id AND t.workspaceId = :workspaceId")
  void deleteByIdAndWorkspaceId(@Param("id") UUID id, @Param("workspaceId") UUID workspaceId);
}
