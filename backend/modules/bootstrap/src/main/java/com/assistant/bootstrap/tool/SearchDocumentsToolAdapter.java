package com.assistant.bootstrap.tool;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.bootstrap.document.WorkspaceDocumentRepository;
import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.application.service.HybridSearchService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class SearchDocumentsToolAdapter implements AgentToolContract {

  private final HybridSearchService hybridSearchService;
  private final WorkspaceDocumentRepository documentRepository;
  private final ObjectMapper objectMapper;

  @Autowired
  public SearchDocumentsToolAdapter(
      HybridSearchService hybridSearchService,
      @Autowired(required = false) WorkspaceDocumentRepository documentRepository,
      ObjectMapper objectMapper) {
    this.hybridSearchService = hybridSearchService;
    this.documentRepository = documentRepository;
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "search_documents";
  }

  @Override
  public String getDescription() {
    return "Tìm kiếm thông tin chính xác từ các tài liệu, hồ sơ (PDF, TXT, Markdown) đã tải lên"
        + " trong workspace với trích dẫn đoạn văn bản nguồn.";
  }

  @Override
  public String getJsonSchema() {
    return """
    {
      "type": "object",
      "properties": {
        "workspaceId": { "type": "string" },
        "query": { "type": "string", "description": "Câu hỏi hoặc nội dung điều khoản, thông tin cần tra cứu từ tài liệu" },
        "limit": { "type": "integer", "description": "Số đoạn trích tối đa cần lấy (mặc định 4)" }
      },
      "required": ["query"]
    }
    """;
  }

  @Override
  public ToolExecutionResult execute(String argumentsJson) {
    try {
      JsonNode jsonNode = objectMapper.readTree(argumentsJson);
      String query = jsonNode.has("query") ? jsonNode.get("query").asText() : "";
      int limit = jsonNode.has("limit") ? jsonNode.get("limit").asInt(4) : 4;

      String workspaceIdStr =
          jsonNode.has("workspaceId") ? jsonNode.get("workspaceId").asText() : "";
      UUID wsUuid;
      try {
        wsUuid = UUID.fromString(workspaceIdStr);
      } catch (Exception e) {
        wsUuid = WorkspaceContextHolder.get().map(WorkspaceId::value).orElseGet(UUID::randomUUID);
      }

      if (query.isBlank()) {
        return ToolExecutionResult.error("Vui lòng cung cấp nội dung truy vấn tìm kiếm tài liệu.");
      }

      List<HybridSearchService.SearchResult> searchResults =
          hybridSearchService.search(wsUuid, query, limit);

      if (searchResults == null || searchResults.isEmpty()) {
        return ToolExecutionResult.ok(
            "Không tìm thấy thông tin hoặc đoạn trích phù hợp trong các tài liệu của workspace cho"
                + " câu hỏi: \""
                + query
                + "\".");
      }

      // Preload document filenames if available
      Map<UUID, String> filenameMap = new HashMap<>();
      if (documentRepository != null) {
        var docs = documentRepository.findByWorkspaceId(wsUuid);
        for (var doc : docs) {
          filenameMap.put(doc.getId(), doc.getFilename());
        }
      }

      List<String> formattedResults = new ArrayList<>();
      for (HybridSearchService.SearchResult res : searchResults) {
        String docName = filenameMap.getOrDefault(res.documentId(), "Tài liệu " + res.documentId());
        formattedResults.add(
            String.format(
                "### Trích dẫn từ: %s (Loại: %s, Đoạn %d, Độ tương đồng RRF: %.4f)\n%s",
                docName, res.documentType(), res.chunkIndex() + 1, res.rrfScore(), res.content()));
      }

      return ToolExecutionResult.ok(
          String.format(
              "Tìm thấy %d đoạn trích liên quan từ tài liệu workspace:\n\n%s",
              formattedResults.size(), String.join("\n\n---\n\n", formattedResults)));
    } catch (Exception e) {
      return ToolExecutionResult.error("Lỗi khi tra cứu tài liệu: " + e.getMessage());
    }
  }
}
