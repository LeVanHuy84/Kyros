package com.assistant.agent.infrastructure.tools;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.application.dto.NoteDto;
import com.assistant.memory.application.service.NoteService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.springframework.stereotype.Component;

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
    return "create_note";
  }

  @Override
  public String getDescription() {
    return "Create a new note in the workspace memory.";
  }

  @Override
  public String getJsonSchema() {
    return """
    {
      "type": "object",
      "properties": {
        "workspaceId": { "type": "string" },
        "userId": { "type": "string" },
        "title": { "type": "string" },
        "content": { "type": "string" }
      },
      "required": ["workspaceId", "userId", "title", "content"]
    }
    """;
  }

  @Override
  public ToolExecutionResult execute(String argumentsJson) {
    try {
      JsonNode jsonNode = objectMapper.readTree(argumentsJson);
      UUID wsId = UUID.fromString(jsonNode.get("workspaceId").asText());
      UUID uId = UUID.fromString(jsonNode.get("userId").asText());
      String title = jsonNode.get("title").asText();
      String content = jsonNode.get("content").asText();

      NoteDto noteDto =
          noteService.createNote(
              new WorkspaceId(wsId), new UserId(uId), title, content, null, null);

      return ToolExecutionResult.ok(
          "Created note ID: " + noteDto.id() + ", Title: " + noteDto.title());
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to create note: " + e.getMessage());
    }
  }
}
