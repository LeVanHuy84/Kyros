package com.assistant.memory.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringDataMemoryEntryRepository extends JpaRepository<MemoryEntryJpaEntity, UUID> {
  Optional<MemoryEntryJpaEntity> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

  Page<MemoryEntryJpaEntity> findByWorkspaceIdAndUserId(
      UUID workspaceId, UUID userId, Pageable pageable);

  long countByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

  @Query(
      "SELECT m FROM MemoryEntryJpaEntity m WHERE m.workspaceId = :workspaceId AND"
          + " m.confidenceScore >= :confidenceThreshold AND (:queryText IS NULL OR LOWER(m.content)"
          + " LIKE LOWER(CONCAT('%', :queryText, '%')))")
  List<MemoryEntryJpaEntity> findBySemanticQuery(
      @Param("workspaceId") UUID workspaceId,
      @Param("queryText") String queryText,
      @Param("confidenceThreshold") float confidenceThreshold,
      Pageable pageable);
}
