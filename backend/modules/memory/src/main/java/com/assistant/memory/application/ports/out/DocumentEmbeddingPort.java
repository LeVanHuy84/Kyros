package com.assistant.memory.application.ports.out;

import java.util.List;
import java.util.UUID;

/**
 * Output port for persisting and searching document embeddings. Separates application service logic
 * from database-specific JPA/vector adapters.
 */
public interface DocumentEmbeddingPort {

  record DocumentChunk(int index, String content) {}

  record ScoredChunk(
      UUID id, UUID documentId, String documentType, int chunkIndex, String content) {}

  void deleteByWorkspaceIdAndDocumentId(UUID workspaceId, UUID documentId);

  void saveAll(
      UUID workspaceId,
      UUID documentId,
      String documentType,
      List<DocumentChunk> chunks,
      List<float[]> embeddings);

  List<ScoredChunk> findNearestNeighbors(UUID workspaceId, float[] queryVector, int limit);

  List<ScoredChunk> findLexicalMatches(UUID workspaceId, String queryText, int limit);
}
