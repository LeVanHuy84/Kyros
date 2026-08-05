package com.assistant.workspace.infrastructure.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringDataWorkspaceRepository extends JpaRepository<WorkspaceJpaEntity, UUID> {

  @Query("SELECT w FROM WorkspaceJpaEntity w JOIN w.memberships m WHERE m.userId = :userId")
  List<WorkspaceJpaEntity> findByUserId(@Param("userId") UUID userId);
}
