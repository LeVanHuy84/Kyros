package com.assistant.bootstrap.tool;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.Note;
import com.assistant.memory.domain.repository.MemoryEntryRepository;
import com.assistant.memory.domain.repository.NoteRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class SemanticSearchToolAdapter implements AgentToolContract {

  private final NoteRepository noteRepository;
  private final MemoryEntryRepository memoryEntryRepository;
  private final ObjectMapper objectMapper;

  public SemanticSearchToolAdapter(
      NoteRepository noteRepository,
      MemoryEntryRepository memoryEntryRepository,
      ObjectMapper objectMapper) {
    this.noteRepository = noteRepository;
    this.memoryEntryRepository = memoryEntryRepository;
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "semantic_search";
  }

  @Override
  public String getDescription() {
    return "Tìm kiếm ngữ nghĩa và tri thức từ các ghi chú (Notes), tài liệu và trí nhớ (Memory) của người dùng trong workspace theo từ khóa hoặc câu hỏi tự nhiên.";
  }

  @Override
  public String getJsonSchema() {
    return """
    {
      "type": "object",
      "properties": {
        "workspaceId": { "type": "string" },
        "query": { "type": "string", "description": "Nội dung cần tìm kiếm hoặc câu hỏi" },
        "limit": { "type": "integer", "description": "Số lượng kết quả tối đa cần lấy (mặc định 5)" }
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
      int limit = jsonNode.has("limit") ? jsonNode.get("limit").asInt(5) : 5;

      String workspaceIdStr =
          jsonNode.has("workspaceId") ? jsonNode.get("workspaceId").asText() : "";
      UUID wsUuid;
      try {
        wsUuid = UUID.fromString(workspaceIdStr);
      } catch (Exception e) {
        wsUuid =
            WorkspaceContextHolder.get()
                .map(WorkspaceId::value)
                .orElseGet(UUID::randomUUID);
      }
      WorkspaceId workspaceId = new WorkspaceId(wsUuid);

      List<String> searchResults = new ArrayList<>();
      String lowerQuery = query.toLowerCase(Locale.ROOT);
      String[] keywords = lowerQuery.split("\\s+");

      // 1. Search notes
      List<Note> allNotes = noteRepository.findByWorkspaceId(workspaceId);
      List<ScoredItem> scoredNotes = new ArrayList<>();
      for (Note note : allNotes) {
        String title = note.getTitle() != null ? note.getTitle().toLowerCase(Locale.ROOT) : "";
        String content = note.getContent() != null ? note.getContent().toLowerCase(Locale.ROOT) : "";
        int score = 0;
        for (String kw : keywords) {
          if (kw.length() >= 2) {
            if (title.contains(kw)) score += 3;
            if (content.contains(kw)) score += 1;
          }
        }
        if (score > 0 || title.contains(lowerQuery) || content.contains(lowerQuery)) {
          scoredNotes.add(new ScoredItem(score, "📝 Note: \"" + note.getTitle() + "\" (ID: " + note.getId().value() + ")\n" + (note.getContent() != null ? note.getContent() : "")));
        }
      }

      scoredNotes.sort((a, b) -> Integer.compare(b.score, a.score));
      for (int i = 0; i < Math.min(limit, scoredNotes.size()); i++) {
        searchResults.add(scoredNotes.get(i).text);
      }

      // 2. Search memory facts
      try {
        var memEntries =
            memoryEntryRepository.findBySemanticQuery(workspaceId, query, limit, 0.5);
        for (var entry : memEntries) {
          searchResults.add("🧠 Memory Fact: " + entry.getContent());
        }
      } catch (Exception ignored) {
      }

      if (searchResults.isEmpty()) {
        return ToolExecutionResult.ok("Không tìm thấy ghi chú hoặc tri thức phù hợp với từ khóa: \"" + query + "\".");
      }

      return ToolExecutionResult.ok("Tìm thấy " + searchResults.size() + " kết quả tri thức liên quan:\n\n" + String.join("\n\n---\n\n", searchResults));
    } catch (Exception e) {
      return ToolExecutionResult.error("Lỗi khi thực hiện semantic_search: " + e.getMessage());
    }
  }

  private record ScoredItem(int score, String text) {}
}
