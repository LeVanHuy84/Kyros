package com.assistant.memory.infrastructure.persistence;

import java.util.Collection;
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

  Page<MemoryEntryJpaEntity> findByWorkspaceId(UUID workspaceId, Pageable pageable);

  List<MemoryEntryJpaEntity> findByWorkspaceIdAndUserIdAndStatus(
      UUID workspaceId, UUID userId, String status);

  List<MemoryEntryJpaEntity> findByWorkspaceIdAndStatus(UUID workspaceId, String status);

  List<MemoryEntryJpaEntity> findByWorkspaceIdAndUserIdAndTopicClusterAndStatus(
      UUID workspaceId, UUID userId, String topicCluster, String status);

  List<MemoryEntryJpaEntity> findByWorkspaceIdAndStatusIn(
      UUID workspaceId, Collection<String> statuses);

  long countByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

  long countByWorkspaceId(UUID workspaceId);

  @Query(
      "SELECT m FROM MemoryEntryJpaEntity m WHERE m.workspaceId = :workspaceId AND"
          + " m.status = 'ACTIVE' AND (m.validTo IS NULL OR m.validTo > CURRENT_TIMESTAMP) AND"
          + " m.confidenceScore >= :confidenceThreshold AND (:queryText IS NULL OR LOWER(m.content)"
          + " LIKE LOWER(CONCAT('%', :queryText, '%')))")
  List<MemoryEntryJpaEntity> findBySemanticQuery(
      @Param("workspaceId") UUID workspaceId,
      @Param("queryText") String queryText,
      @Param("confidenceThreshold") float confidenceThreshold,
      Pageable pageable);
}
