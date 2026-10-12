package com.assistant.memory.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

@Entity
@Table(name = "document_embeddings", schema = "memory")
public class DocumentEmbeddingJpaEntity {

  @Id private UUID id;

  @Column(name = "workspace_id", nullable = false)
  private UUID workspaceId;

  @Column(name = "document_id", nullable = false)
  private UUID documentId;

  @Column(name = "document_type", nullable = false, length = 50)
  private String documentType;

  @Column(name = "chunk_index", nullable = false)
  private int chunkIndex;

  @Column(name = "content", nullable = false, columnDefinition = "TEXT")
  private String content;

  @Column(name = "embedding", columnDefinition = "vector(384)", nullable = false)
  private String embedding;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  public DocumentEmbeddingJpaEntity() {}

  public DocumentEmbeddingJpaEntity(
      UUID id,
      UUID workspaceId,
      UUID documentId,
      String documentType,
      int chunkIndex,
      String content,
      String embedding,
      Instant createdAt) {
    this.id = id;
    this.workspaceId = workspaceId;
    this.documentId = documentId;
    this.documentType = documentType;
    this.chunkIndex = chunkIndex;
    this.content = content;
    this.embedding = embedding;
    this.createdAt = createdAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getWorkspaceId() {
    return workspaceId;
  }

  public UUID getDocumentId() {
    return documentId;
  }

  public String getDocumentType() {
    return documentType;
  }

  public int getChunkIndex() {
    return chunkIndex;
  }

  public String getContent() {
    return content;
  }

  public String getEmbedding() {
    return embedding;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public static String toVectorString(float[] vector) {
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < vector.length; i++) {
      if (i > 0) {
        sb.append(",");
      }
      sb.append(vector[i]);
    }
    sb.append("]");
    return sb.toString();
  }

  public static float[] toFloatArray(@Nullable String str) {
    if (str == null || str.length() < 2) {
      return new float[0];
    }
    String trimmed = str.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      trimmed = trimmed.substring(1, trimmed.length() - 1);
    }
    if (trimmed.isEmpty()) {
      return new float[0];
    }
    String[] parts = COMMA_PATTERN.split(trimmed);
    float[] res = new float[parts.length];
    for (int i = 0; i < parts.length; i++) {
      res[i] = Float.parseFloat(parts[i].trim());
    }
    return res;
  }

  private static final java.util.regex.Pattern COMMA_PATTERN = java.util.regex.Pattern.compile(",");
}
