package com.assistant.bootstrap.document;

import com.assistant.kernel.exception.EntityNotFoundException;
import com.assistant.memory.application.service.DocumentChunkingService;
import com.assistant.memory.application.service.HybridSearchService;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DocumentIngestionService {

  private static final Logger log = LoggerFactory.getLogger(DocumentIngestionService.class);

  public record WorkspaceDocumentDto(
      UUID id,
      UUID workspaceId,
      UUID userId,
      String filename,
      String contentType,
      long fileSize,
      int chunkCount,
      Instant createdAt) {}

  private final WorkspaceDocumentRepository documentRepository;
  private final HybridSearchService hybridSearchService;
  private final DocumentChunkingService chunkingService;

  public DocumentIngestionService(
      WorkspaceDocumentRepository documentRepository,
      HybridSearchService hybridSearchService,
      DocumentChunkingService chunkingService) {
    this.documentRepository = documentRepository;
    this.hybridSearchService = hybridSearchService;
    this.chunkingService = chunkingService;
  }

  @Transactional
  public WorkspaceDocumentDto ingestDocument(
      UUID workspaceId, UUID userId, String filename, String contentType, byte[] fileBytes) {
    if (fileBytes == null || fileBytes.length == 0) {
      throw new IllegalArgumentException("Document content cannot be empty.");
    }

    String safeFilename =
        (filename != null && !filename.isBlank()) ? filename.trim() : "document.txt";
    String effectiveContentType =
        (contentType != null && !contentType.isBlank())
            ? contentType.toLowerCase(Locale.ROOT)
            : detectContentType(safeFilename);

    String extractedText = extractText(fileBytes, safeFilename, effectiveContentType);
    if (extractedText.isBlank()) {
      throw new IllegalArgumentException("No readable text found in document.");
    }

    UUID documentId = UUID.randomUUID();
    List<DocumentChunkingService.Chunk> chunks = chunkingService.chunkText(extractedText, 600, 100);
    int chunkCount = chunks.size();

    // 1. Index vectors and BM25 lexical tokens into memory.document_embeddings
    hybridSearchService.indexDocument(workspaceId, documentId, "DOCUMENT", extractedText);

    // 2. Persist metadata
    WorkspaceDocumentJpaEntity entity =
        new WorkspaceDocumentJpaEntity(
            documentId,
            workspaceId,
            userId,
            safeFilename,
            effectiveContentType,
            fileBytes.length,
            chunkCount,
            Instant.now());
    documentRepository.save(entity);

    log.info(
        "Ingested document {} ({} chunks) for workspace {}", safeFilename, chunkCount, workspaceId);

    return toDto(entity);
  }

  @Transactional(readOnly = true)
  public List<WorkspaceDocumentDto> listDocuments(UUID workspaceId) {
    return documentRepository.findByWorkspaceId(workspaceId).stream().map(this::toDto).toList();
  }

  @Transactional(readOnly = true)
  public Optional<WorkspaceDocumentDto> getDocument(UUID workspaceId, UUID documentId) {
    return documentRepository.findByIdAndWorkspaceId(documentId, workspaceId).map(this::toDto);
  }

  @Transactional
  public void deleteDocument(UUID workspaceId, UUID documentId) {
    if (documentRepository.findByIdAndWorkspaceId(documentId, workspaceId).isEmpty()) {
      throw new EntityNotFoundException("document.not_found", "Document not found in workspace");
    }
    documentRepository.delete(documentId, workspaceId);
    hybridSearchService.removeDocumentEmbeddings(workspaceId, documentId);
    log.info("Deleted document {} from workspace {}", documentId, workspaceId);
  }

  private String extractText(byte[] bytes, String filename, String contentType) {
    boolean isPdf =
        contentType.contains("pdf") || filename.toLowerCase(Locale.ROOT).endsWith(".pdf");
    if (isPdf) {
      try (PDDocument document = Loader.loadPDF(bytes)) {
        PDFTextStripper stripper = new PDFTextStripper();
        return stripper.getText(document).trim();
      } catch (IOException e) {
        log.warn(
            "Failed to extract text from PDF using PDFBox, falling back to UTF-8: {}",
            e.getMessage());
        return new String(bytes, StandardCharsets.UTF_8).trim();
      }
    }
    return new String(bytes, StandardCharsets.UTF_8).trim();
  }

  private String detectContentType(String filename) {
    String lower = filename.toLowerCase(Locale.ROOT);
    if (lower.endsWith(".pdf")) {
      return "application/pdf";
    }
    if (lower.endsWith(".md") || lower.endsWith(".markdown")) {
      return "text/markdown";
    }
    if (lower.endsWith(".json")) {
      return "application/json";
    }
    if (lower.endsWith(".csv")) {
      return "text/csv";
    }
    return "text/plain";
  }

  private WorkspaceDocumentDto toDto(WorkspaceDocumentJpaEntity entity) {
    return new WorkspaceDocumentDto(
        entity.getId(),
        entity.getWorkspaceId(),
        entity.getUserId(),
        entity.getFilename(),
        entity.getContentType(),
        entity.getFileSize(),
        entity.getChunkCount(),
        entity.getCreatedAt());
  }
}
