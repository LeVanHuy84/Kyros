package com.assistant.memory.infrastructure.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SpringDataDocumentEmbeddingRepository
    extends JpaRepository<DocumentEmbeddingJpaEntity, UUID> {

  @Modifying
  @Query("DELETE FROM DocumentEmbeddingJpaEntity d WHERE d.documentId = :documentId")
  void deleteByDocumentId(@Param("documentId") UUID documentId);

  @Modifying
  @Query(
      "DELETE FROM DocumentEmbeddingJpaEntity d WHERE d.workspaceId = :workspaceId AND d.documentId"
          + " = :documentId")
  void deleteByWorkspaceIdAndDocumentId(
      @Param("workspaceId") UUID workspaceId, @Param("documentId") UUID documentId);

  @Query(
      value =
          "SELECT * FROM memory.document_embeddings "
              + "WHERE workspace_id = :workspaceId "
              + "ORDER BY embedding <=> CAST(:queryVector AS vector) "
              + "LIMIT :limit",
      nativeQuery = true)
  List<DocumentEmbeddingJpaEntity> findNearestNeighbors(
      @Param("workspaceId") UUID workspaceId,
      @Param("queryVector") String queryVector,
      @Param("limit") int limit);

  @Query(
      value =
          "SELECT * FROM memory.document_embeddings WHERE workspace_id = :workspaceId AND"
              + " to_tsvector('simple', content) @@ plainto_tsquery('simple', :queryText) ORDER BY"
              + " ts_rank_cd(to_tsvector('simple', content), plainto_tsquery('simple', :queryText))"
              + " DESC LIMIT :limit",
      nativeQuery = true)
  List<DocumentEmbeddingJpaEntity> findLexicalMatches(
      @Param("workspaceId") UUID workspaceId,
      @Param("queryText") String queryText,
      @Param("limit") int limit);
}
