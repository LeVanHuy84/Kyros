package com.assistant.memory.application.service;

import com.assistant.memory.application.ports.out.DocumentEmbeddingPort;
import com.assistant.memory.application.ports.out.EmbeddingPort;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Production-grade Hybrid RAG engine combining dense vector similarity (pgvector 384d HNSW) and
 * sparse lexical search (PostgreSQL BM25 Full-Text Search) with Reciprocal Rank Fusion (RRF).
 * Adheres strictly to Hexagonal Architecture by depending exclusively on ports and domain services.
 */
@Service
public class HybridSearchService {

  private static final int RRF_K = 60;

  public record SearchResult(
      UUID documentId, String documentType, int chunkIndex, String content, double rrfScore) {}

  private final DocumentEmbeddingPort documentEmbeddingPort;
  private final EmbeddingPort embeddingPort;
  private final DocumentChunkingService chunkingService;

  public HybridSearchService(
      DocumentEmbeddingPort documentEmbeddingPort,
      EmbeddingPort embeddingPort,
      DocumentChunkingService chunkingService) {
    this.documentEmbeddingPort = documentEmbeddingPort;
    this.embeddingPort = embeddingPort;
    this.chunkingService = chunkingService;
  }

  @Transactional
  public void indexDocument(
      UUID workspaceId, UUID documentId, String documentType, String content) {
    documentEmbeddingPort.deleteByWorkspaceIdAndDocumentId(workspaceId, documentId);

    if (content == null || content.isBlank()) {
      return;
    }

    List<DocumentChunkingService.Chunk> chunks = chunkingService.chunkText(content);
    if (chunks.isEmpty()) {
      return;
    }

    List<String> chunkTexts = chunks.stream().map(DocumentChunkingService.Chunk::content).toList();
    List<float[]> embeddings = embeddingPort.embedBatch(chunkTexts);

    List<DocumentEmbeddingPort.DocumentChunk> portChunks =
        chunks.stream()
            .map(c -> new DocumentEmbeddingPort.DocumentChunk(c.index(), c.content()))
            .toList();

    documentEmbeddingPort.saveAll(workspaceId, documentId, documentType, portChunks, embeddings);
  }

  @Transactional
  public void removeDocumentEmbeddings(UUID workspaceId, UUID documentId) {
    documentEmbeddingPort.deleteByWorkspaceIdAndDocumentId(workspaceId, documentId);
  }

  @Transactional(readOnly = true)
  public List<SearchResult> search(UUID workspaceId, String query, int limit) {
    if (query == null || query.isBlank() || limit <= 0) {
      return List.of();
    }

    int candidateLimit = Math.max(limit * 2, 10);
    float[] queryVector = embeddingPort.embed(query);

    List<DocumentEmbeddingPort.ScoredChunk> denseCandidates =
        documentEmbeddingPort.findNearestNeighbors(workspaceId, queryVector, candidateLimit);

    List<DocumentEmbeddingPort.ScoredChunk> lexicalCandidates =
        documentEmbeddingPort.findLexicalMatches(workspaceId, query.trim(), candidateLimit);

    // Reciprocal Rank Fusion (RRF)
    Map<UUID, Double> scoreMap = new HashMap<>();
    Map<UUID, DocumentEmbeddingPort.ScoredChunk> chunkMap = new HashMap<>();

    for (int rank = 0; rank < denseCandidates.size(); rank++) {
      var chunk = denseCandidates.get(rank);
      chunkMap.put(chunk.id(), chunk);
      double currentScore = scoreMap.getOrDefault(chunk.id(), 0.0);
      scoreMap.put(chunk.id(), currentScore + (1.0 / (RRF_K + rank + 1)));
    }

    for (int rank = 0; rank < lexicalCandidates.size(); rank++) {
      var chunk = lexicalCandidates.get(rank);
      chunkMap.put(chunk.id(), chunk);
      double currentScore = scoreMap.getOrDefault(chunk.id(), 0.0);
      scoreMap.put(chunk.id(), currentScore + (1.0 / (RRF_K + rank + 1)));
    }

    return scoreMap.entrySet().stream()
        .sorted(Map.Entry.<UUID, Double>comparingByValue().reversed())
        .limit(limit)
        .map(
            entry -> {
              var chunk = chunkMap.get(entry.getKey());
              return new SearchResult(
                  chunk.documentId(),
                  chunk.documentType(),
                  chunk.chunkIndex(),
                  chunk.content(),
                  entry.getValue());
            })
        .toList();
  }
}
