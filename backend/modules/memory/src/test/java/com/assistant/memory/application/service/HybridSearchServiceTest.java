package com.assistant.memory.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.assistant.memory.application.ports.out.DocumentEmbeddingPort;
import com.assistant.memory.application.ports.out.EmbeddingPort;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class HybridSearchServiceTest {

  private DocumentEmbeddingPort documentEmbeddingPort;
  private EmbeddingPort embeddingPort;
  private DocumentChunkingService chunkingService;
  private HybridSearchService hybridSearchService;

  @BeforeEach
  void setUp() {
    documentEmbeddingPort = mock(DocumentEmbeddingPort.class);
    embeddingPort = mock(EmbeddingPort.class);
    chunkingService = new DocumentChunkingService();
    hybridSearchService =
        new HybridSearchService(documentEmbeddingPort, embeddingPort, chunkingService);
  }

  @Test
  void testIndexDocument() {
    UUID wsId = UUID.randomUUID();
    UUID docId = UUID.randomUUID();
    String content = "Chính sách bảo mật dữ liệu doanh nghiệp và quản lý khóa API.";

    when(embeddingPort.embedBatch(anyList())).thenReturn(List.of(new float[384]));

    hybridSearchService.indexDocument(wsId, docId, "DOCUMENT", content);

    verify(documentEmbeddingPort).deleteByWorkspaceIdAndDocumentId(wsId, docId);
    verify(documentEmbeddingPort)
        .saveAll(eq(wsId), eq(docId), eq("DOCUMENT"), anyList(), anyList());
  }

  @Test
  void testRemoveDocumentEmbeddings() {
    UUID wsId = UUID.randomUUID();
    UUID docId = UUID.randomUUID();

    hybridSearchService.removeDocumentEmbeddings(wsId, docId);

    verify(documentEmbeddingPort).deleteByWorkspaceIdAndDocumentId(wsId, docId);
  }

  @Test
  void testSearchWithRrf() {
    UUID wsId = UUID.randomUUID();
    UUID chunkId1 = UUID.randomUUID();
    UUID chunkId2 = UUID.randomUUID();
    UUID docId = UUID.randomUUID();

    when(embeddingPort.embed("bảo mật")).thenReturn(new float[384]);

    DocumentEmbeddingPort.ScoredChunk denseChunk =
        new DocumentEmbeddingPort.ScoredChunk(chunkId1, docId, "DOCUMENT", 0, "Chính sách bảo mật");
    DocumentEmbeddingPort.ScoredChunk lexicalChunk =
        new DocumentEmbeddingPort.ScoredChunk(
            chunkId2, docId, "DOCUMENT", 1, "Quy trình xác thực bảo mật");

    when(documentEmbeddingPort.findNearestNeighbors(eq(wsId), any(), anyInt()))
        .thenReturn(List.of(denseChunk));
    when(documentEmbeddingPort.findLexicalMatches(eq(wsId), eq("bảo mật"), anyInt()))
        .thenReturn(List.of(lexicalChunk));

    var results = hybridSearchService.search(wsId, "bảo mật", 5);

    assertNotNull(results);
    assertEquals(2, results.size());
    assertFalse(results.isEmpty());
  }
}
