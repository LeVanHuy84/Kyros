package com.assistant.bootstrap.document;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.assistant.memory.application.service.DocumentChunkingService;
import com.assistant.memory.application.service.HybridSearchService;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DocumentIngestionServiceTest {

  private WorkspaceDocumentRepository documentRepository;
  private HybridSearchService hybridSearchService;
  private DocumentChunkingService chunkingService;
  private DocumentIngestionService ingestionService;

  @BeforeEach
  void setUp() {
    documentRepository = mock(WorkspaceDocumentRepository.class);
    hybridSearchService = mock(HybridSearchService.class);
    chunkingService = new DocumentChunkingService();
    ingestionService =
        new DocumentIngestionService(documentRepository, hybridSearchService, chunkingService);
  }

  @Test
  void testIngestMarkdownDocumentSuccess() {
    UUID wsId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    String content =
        "# Hợp đồng nguyên tắc\n\nĐiều 1: Bên A cung cấp dịch vụ quản trị hệ thống cloud.";
    byte[] bytes = content.getBytes(StandardCharsets.UTF_8);

    var result =
        ingestionService.ingestDocument(wsId, userId, "contract.md", "text/markdown", bytes);

    assertNotNull(result);
    assertEquals("contract.md", result.filename());
    assertEquals("text/markdown", result.contentType());
    verify(hybridSearchService)
        .indexDocument(eq(wsId), any(UUID.class), eq("DOCUMENT"), eq(content));
    verify(documentRepository).save(any(WorkspaceDocumentJpaEntity.class));
  }

  @Test
  void testIngestEmptyThrowsException() {
    UUID wsId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();

    assertThrows(
        IllegalArgumentException.class,
        () ->
            ingestionService.ingestDocument(wsId, userId, "empty.txt", "text/plain", new byte[0]));
  }

  @Test
  void testListDocuments() {
    UUID wsId = UUID.randomUUID();
    WorkspaceDocumentJpaEntity entity =
        new WorkspaceDocumentJpaEntity(
            UUID.randomUUID(),
            wsId,
            UUID.randomUUID(),
            "policy.pdf",
            "application/pdf",
            1024L,
            2,
            Instant.now());
    when(documentRepository.findByWorkspaceId(wsId)).thenReturn(List.of(entity));

    var docs = ingestionService.listDocuments(wsId);
    assertEquals(1, docs.size());
    assertEquals("policy.pdf", docs.get(0).filename());
  }

  @Test
  void testDeleteDocument() {
    UUID wsId = UUID.randomUUID();
    UUID docId = UUID.randomUUID();
    WorkspaceDocumentJpaEntity entity =
        new WorkspaceDocumentJpaEntity(
            docId,
            wsId,
            UUID.randomUUID(),
            "policy.pdf",
            "application/pdf",
            1024L,
            2,
            Instant.now());
    when(documentRepository.findByIdAndWorkspaceId(docId, wsId)).thenReturn(Optional.of(entity));

    ingestionService.deleteDocument(wsId, docId);

    verify(documentRepository).delete(docId, wsId);
    verify(hybridSearchService).removeDocumentEmbeddings(wsId, docId);
  }
}
