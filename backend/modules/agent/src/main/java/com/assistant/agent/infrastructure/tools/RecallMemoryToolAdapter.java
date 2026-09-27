package com.assistant.agent.infrastructure.tools;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.MemoryEntry;
import com.assistant.memory.domain.repository.MemoryEntryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Tool adapter for recalling relevant long-term memory facts, preferences, and work rules. */
@Component
public class RecallMemoryToolAdapter implements AgentToolContract {

  private final MemoryEntryRepository memoryEntryRepository;
  private final ObjectMapper objectMapper;

  public RecallMemoryToolAdapter(
      MemoryEntryRepository memoryEntryRepository, ObjectMapper objectMapper) {
    this.memoryEntryRepository = memoryEntryRepository;
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "recall_memory";
  }

  @Override
  public String getDescription() {
    return "Search and recall relevant active facts, habits, and work rules from the long-term"
        + " memory vault.";
  }

  @Override
  public String getJsonSchema() {
    return """
    {
      "type": "object",
      "properties": {
        "query": { "type": "string", "description": "Keywords or question to search memory for" },
        "limit": { "type": "integer", "description": "Maximum number of memories to recall (default 5)" }
      },
      "required": ["query"]
    }
    """;
  }

  @Override
  public ToolExecutionResult execute(String argumentsJson) {
    try {
      JsonNode jsonNode = objectMapper.readTree(argumentsJson);

      UUID wsUuid = null;
      if (jsonNode.has("workspaceId") && !jsonNode.get("workspaceId").asText().isBlank()) {
        try {
          wsUuid = UUID.fromString(jsonNode.get("workspaceId").asText());
        } catch (Exception ignored) {
        }
      }
      if (wsUuid == null) {
        wsUuid = WorkspaceContextHolder.get().map(WorkspaceId::value).orElseGet(UUID::randomUUID);
      }
      WorkspaceId workspaceId = new WorkspaceId(wsUuid);

      String query = jsonNode.has("query") ? jsonNode.get("query").asText() : "";
      int limit = jsonNode.has("limit") ? jsonNode.get("limit").asInt(5) : 5;

      List<MemoryEntry> recalled =
          memoryEntryRepository.findBySemanticQuery(workspaceId, query, limit, 0.50);
      if (recalled.isEmpty()) {
        return ToolExecutionResult.ok("No relevant memory facts found for query: " + query);
      }

      StringBuilder sb = new StringBuilder("Recalled memory facts:\n");
      for (MemoryEntry entry : recalled) {
        entry.touchAccess();
        memoryEntryRepository.save(entry);
        sb.append("- ")
            .append(entry.getContent())
            .append(" (Score: ")
            .append(entry.getConfidenceScore())
            .append(")\n");
      }

      return ToolExecutionResult.ok(sb.toString().trim());
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to recall memory: " + e.getMessage());
    }
  }
}
