package com.assistant.agent.infrastructure.tools;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.application.service.NoteService;
import com.assistant.memory.domain.model.NoteId;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Tool adapter for deleting notes (Human-in-the-loop protected). */
@Component
public class DeleteNotesToolAdapter implements AgentToolContract {

  private final NoteService noteService;
  private final ObjectMapper objectMapper;

  public DeleteNotesToolAdapter(NoteService noteService, ObjectMapper objectMapper) {
    this.noteService = noteService;
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "delete_notes";
  }

  @Override
  public String getDescription() {
    return "Xóa một hoặc nhiều ghi chú (Notes) dựa vào danh sách ID.";
  }

  @Override
  public String getJsonSchema() {
    return """
    {
      "type": "object",
      "properties": {
        "noteIds": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Danh sách các Note ID cần xóa"
        },
        "id": { "type": "string", "description": "ID nếu xóa 1 ghi chú duy nhất" }
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
      if (jsonNode.has("noteIds") && jsonNode.get("noteIds").isArray()) {
        jsonNode.get("noteIds").forEach(n -> ids.add(n.asText()));
      } else if (jsonNode.has("ids") && jsonNode.get("ids").isArray()) {
        jsonNode.get("ids").forEach(n -> ids.add(n.asText()));
      } else if (jsonNode.has("id")) {
        ids.add(jsonNode.get("id").asText());
      } else if (jsonNode.has("noteId")) {
        ids.add(jsonNode.get("noteId").asText());
      }

      int deletedCount = 0;
      for (String idStr : ids) {
        try {
          NoteId noteId = new NoteId(UUID.fromString(idStr));
          noteService.deleteNote(workspaceId, noteId);
          deletedCount++;
        } catch (Exception ignored) {
        }
      }

      return ToolExecutionResult.ok(
          "Đã xóa thành công " + deletedCount + " ghi chú (" + String.join(", ", ids) + ").");
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute delete_notes tool: " + e.getMessage());
    }
  }
}
