package com.assistant.bootstrap.tool;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.bootstrap.document.WorkspaceDocumentJpaEntity;
import com.assistant.bootstrap.document.WorkspaceDocumentRepository;
import com.assistant.memory.application.service.HybridSearchService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SearchDocumentsToolAdapterTest {

  private HybridSearchService hybridSearchService;
  private WorkspaceDocumentRepository documentRepository;
  private ObjectMapper objectMapper;
  private SearchDocumentsToolAdapter adapter;

  @BeforeEach
  void setUp() {
    hybridSearchService = mock(HybridSearchService.class);
    documentRepository = mock(WorkspaceDocumentRepository.class);
    objectMapper = new ObjectMapper();
    adapter = new SearchDocumentsToolAdapter(hybridSearchService, documentRepository, objectMapper);
  }

  @Test
  void testToolMetadata() {
    assertEquals("search_documents", adapter.getName());
    assertTrue(adapter.getDescription().contains("tài liệu"));
    assertTrue(adapter.getJsonSchema().contains("query"));
  }

  @Test
  void testExecuteWithResults() {
    UUID wsId = UUID.randomUUID();
    UUID docId = UUID.randomUUID();

    WorkspaceDocumentJpaEntity entity =
        new WorkspaceDocumentJpaEntity(
            docId,
            wsId,
            UUID.randomUUID(),
            "hop_dong_dich_vu.pdf",
            "application/pdf",
            2048L,
            3,
            Instant.now());
    when(documentRepository.findByWorkspaceId(wsId)).thenReturn(List.of(entity));

    HybridSearchService.SearchResult chunkResult =
        new HybridSearchService.SearchResult(
            docId,
            "DOCUMENT",
            0,
            "Thời hạn bảo hành dịch vụ kỹ thuật là 12 tháng kể từ ngày nghiệm thu.",
            0.0333);

    when(hybridSearchService.search(eq(wsId), eq("bảo hành"), anyInt()))
        .thenReturn(List.of(chunkResult));

    String jsonArgs = "{\"workspaceId\":\"" + wsId + "\",\"query\":\"bảo hành\",\"limit\":3}";
    ToolExecutionResult result = adapter.execute(jsonArgs);

    assertNotNull(result);
    assertFalse(result.requiresApproval());
    assertTrue(result.output().contains("hop_dong_dich_vu.pdf"));
    assertTrue(result.output().contains("12 tháng"));
  }

  @Test
  void testExecuteNoResults() {
    UUID wsId = UUID.randomUUID();
    when(hybridSearchService.search(any(), any(), anyInt())).thenReturn(List.of());

    String jsonArgs = "{\"workspaceId\":\"" + wsId + "\",\"query\":\"chính sách thuế\"}";
    ToolExecutionResult result = adapter.execute(jsonArgs);

    assertTrue(result.output().contains("Không tìm thấy thông tin"));
  }
}
