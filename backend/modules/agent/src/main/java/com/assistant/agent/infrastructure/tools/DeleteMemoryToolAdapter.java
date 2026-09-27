package com.assistant.agent.infrastructure.tools;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.MemoryId;
import com.assistant.memory.domain.repository.MemoryEntryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Tool adapter for deleting long-term memory entries (Human-in-the-loop protected). */
@Component
public class DeleteMemoryToolAdapter implements AgentToolContract {

  private final MemoryEntryRepository memoryEntryRepository;
  private final ObjectMapper objectMapper;

  public DeleteMemoryToolAdapter(
      MemoryEntryRepository memoryEntryRepository, ObjectMapper objectMapper) {
    this.memoryEntryRepository = memoryEntryRepository;
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "delete_memory";
  }

  @Override
  public String getDescription() {
    return "Xóa một hoặc nhiều bản ghi trí nhớ (Memory Entries) dựa vào danh sách ID.";
  }

  @Override
  public String getJsonSchema() {
    return """
    {
      "type": "object",
      "properties": {
        "memoryIds": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Danh sách các Memory ID cần xóa"
        },
        "id": { "type": "string", "description": "ID nếu xóa 1 bản ghi trí nhớ duy nhất" }
      }
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

      List<String> ids = new ArrayList<>();
      if (jsonNode.has("memoryIds") && jsonNode.get("memoryIds").isArray()) {
        jsonNode.get("memoryIds").forEach(n -> ids.add(n.asText()));
      } else if (jsonNode.has("ids") && jsonNode.get("ids").isArray()) {
        jsonNode.get("ids").forEach(n -> ids.add(n.asText()));
      } else if (jsonNode.has("id")) {
        ids.add(jsonNode.get("id").asText());
      } else if (jsonNode.has("memoryId")) {
        ids.add(jsonNode.get("memoryId").asText());
      }

      int deletedCount = 0;
      for (String idStr : ids) {
        try {
          MemoryId memId = new MemoryId(UUID.fromString(idStr));
          memoryEntryRepository.delete(memId, workspaceId);
          deletedCount++;
        } catch (Exception ignored) {
        }
      }

      return ToolExecutionResult.ok(
          "Đã xóa thành công "
              + deletedCount
              + " bản ghi trí nhớ ("
              + String.join(", ", ids)
              + ").");
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute delete_memory: " + e.getMessage());
    }
  }
}
