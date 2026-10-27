package com.assistant.bootstrap.document;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "documents", schema = "workspace")
public class WorkspaceDocumentJpaEntity {

  @Id
  @Column(name = "id", nullable = false)
  private UUID id;

  @Column(name = "workspace_id", nullable = false)
  private UUID workspaceId;

  @Column(name = "user_id")
  private UUID userId;

  @Column(name = "filename", nullable = false, length = 255)
  private String filename;

  @Column(name = "content_type", length = 100)
  private String contentType;

  @Column(name = "file_size", nullable = false)
  private long fileSize;

  @Column(name = "chunk_count", nullable = false)
  private int chunkCount;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected WorkspaceDocumentJpaEntity() {}

  public WorkspaceDocumentJpaEntity(
      UUID id,
      UUID workspaceId,
      UUID userId,
      String filename,
      String contentType,
      long fileSize,
      int chunkCount,
      Instant createdAt) {
    this.id = id;
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.filename = filename;
    this.contentType = contentType;
    this.fileSize = fileSize;
    this.chunkCount = chunkCount;
    this.createdAt = createdAt != null ? createdAt : Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public UUID getWorkspaceId() {
    return workspaceId;
  }

  public UUID getUserId() {
    return userId;
  }

  public String getFilename() {
    return filename;
  }

  public String getContentType() {
    return contentType;
  }

  public long getFileSize() {
    return fileSize;
  }

  public int getChunkCount() {
    return chunkCount;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
