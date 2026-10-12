package com.assistant.memory.infrastructure.persistence;

import com.assistant.memory.application.ports.out.DocumentEmbeddingPort;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional
public class DocumentEmbeddingRepositoryAdapter implements DocumentEmbeddingPort {

  private final SpringDataDocumentEmbeddingRepository repository;

  public DocumentEmbeddingRepositoryAdapter(SpringDataDocumentEmbeddingRepository repository) {
    this.repository = repository;
  }

  @Override
  public void deleteByWorkspaceIdAndDocumentId(UUID workspaceId, UUID documentId) {
    repository.deleteByWorkspaceIdAndDocumentId(workspaceId, documentId);
  }

  @Override
  public void saveAll(
      UUID workspaceId,
      UUID documentId,
      String documentType,
      List<DocumentChunk> chunks,
      List<float[]> embeddings) {
    List<DocumentEmbeddingJpaEntity> entities = new ArrayList<>(chunks.size());
    Instant now = Instant.now();

    for (int i = 0; i < chunks.size(); i++) {
      DocumentChunk chunk = chunks.get(i);
      float[] vector = embeddings.get(i);
      String vectorStr = DocumentEmbeddingJpaEntity.toVectorString(vector);

      entities.add(
          new DocumentEmbeddingJpaEntity(
              UUID.randomUUID(),
              workspaceId,
              documentId,
              documentType,
              chunk.index(),
              chunk.content(),
              vectorStr,
              now));
    }

    repository.saveAll(entities);
  }

  @Override
  @Transactional(readOnly = true)
  public List<ScoredChunk> findNearestNeighbors(UUID workspaceId, float[] queryVector, int limit) {
    String queryVectorStr = DocumentEmbeddingJpaEntity.toVectorString(queryVector);
    try {
      List<DocumentEmbeddingJpaEntity> entities =
          repository.findNearestNeighbors(workspaceId, queryVectorStr, limit);
      return entities.stream()
          .map(
              e ->
                  new ScoredChunk(
                      e.getId(),
                      e.getDocumentId(),
                      e.getDocumentType(),
                      e.getChunkIndex(),
                      e.getContent()))
          .toList();
    } catch (Exception ignored) {
      return List.of();
    }
  }

  @Override
  @Transactional(readOnly = true)
  public List<ScoredChunk> findLexicalMatches(UUID workspaceId, String queryText, int limit) {
    try {
      List<DocumentEmbeddingJpaEntity> entities =
          repository.findLexicalMatches(workspaceId, queryText, limit);
      return entities.stream()
          .map(
              e ->
                  new ScoredChunk(
                      e.getId(),
                      e.getDocumentId(),
                      e.getDocumentType(),
                      e.getChunkIndex(),
                      e.getContent()))
          .toList();
    } catch (Exception ignored) {
      return List.of();
    }
  }
}
