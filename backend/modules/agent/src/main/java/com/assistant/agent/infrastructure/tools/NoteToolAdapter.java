package com.assistant.agent.infrastructure.tools;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.application.dto.NoteDto;
import com.assistant.memory.application.service.NoteService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Token-efficient tool adapter for creating or updating notes (batching supported). */
@Component
public class NoteToolAdapter implements AgentToolContract {

  private final NoteService noteService;
  private final ObjectMapper objectMapper;

  public NoteToolAdapter(NoteService noteService, ObjectMapper objectMapper) {
    this.noteService = noteService;
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "upsert_notes";
  }

  @Override
  public String getDescription() {
    return "Create or update one or more notes in the workspace. Automatically handles batching.";
  }

  @Override
  public String getJsonSchema() {
    return """
    {
      "type": "object",
      "properties": {
        "notes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string", "description": "Optional note ID when updating" },
              "title": { "type": "string", "description": "Title or topic of the note" },
              "content": { "type": "string", "description": "Detailed content of the note" },
              "tags": { "type": "array", "items": { "type": "string" }, "description": "Optional list of tags" }
            },
            "required": ["title", "content"]
          }
        },
        "title": { "type": "string", "description": "Title if creating a single note" },
        "content": { "type": "string", "description": "Content if creating a single note" }
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

      UUID uUuid = UUID.fromString("00000000-0000-0000-0000-000000000001");
      if (jsonNode.has("userId") && !jsonNode.get("userId").asText().isBlank()) {
        try {
          uUuid = UUID.fromString(jsonNode.get("userId").asText());
        } catch (Exception ignored) {
        }
      }
      UserId userId = new UserId(uUuid);

      List<JsonNode> noteItems = new ArrayList<>();
      if (jsonNode.has("notes") && jsonNode.get("notes").isArray()) {
        jsonNode.get("notes").forEach(noteItems::add);
      } else if (jsonNode.has("title")) {
        noteItems.add(jsonNode);
      }

      if (noteItems.isEmpty()) {
        return ToolExecutionResult.error("No valid note data provided in arguments.");
      }

      List<String> results = new ArrayList<>();
      for (JsonNode item : noteItems) {
        String title = item.has("title") ? item.get("title").asText() : "Ghi chú mới";
        String content = item.has("content") ? item.get("content").asText() : "";
        UUID taskId = null;
        UUID eventId = null;
        if (item.has("taskId") && !item.get("taskId").asText().isBlank()) {
          try {
            taskId = UUID.fromString(item.get("taskId").asText());
          } catch (Exception ignored) {
          }
        }
        if (item.has("eventId") && !item.get("eventId").asText().isBlank()) {
          try {
            eventId = UUID.fromString(item.get("eventId").asText());
          } catch (Exception ignored) {
          }
        }

        NoteDto noteDto =
            noteService.createNote(workspaceId, userId, title, content, taskId, eventId);
        results.add(noteDto.title() + " (ID: " + noteDto.id() + ")");
      }

      return ToolExecutionResult.ok(
          "Đã lưu thành công " + results.size() + " ghi chú: " + String.join(", ", results));
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute upsert_notes: " + e.getMessage());
    }
  }
}
