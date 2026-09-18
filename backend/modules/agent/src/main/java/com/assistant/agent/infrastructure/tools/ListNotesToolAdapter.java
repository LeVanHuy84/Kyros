package com.assistant.agent.infrastructure.tools;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.memory.application.service.NoteService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class ListNotesToolAdapter implements AgentToolContract {

  private final NoteService noteService;
  private final ObjectMapper objectMapper;

  public ListNotesToolAdapter(NoteService noteService, ObjectMapper objectMapper) {
    this.noteService = noteService;
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "list_notes";
  }

  @Override
  public String getDescription() {
    return "List saved notes in the workspace.";
  }

  @Override
  public String getJsonSchema() {
    return """
    {
      "type": "object",
      "properties": {
        "workspaceId": { "type": "string" }
      },
      "required": []
    }
    """;
  }

  @Override
  public ToolExecutionResult execute(String argumentsJson) {
    try {
      String workspaceIdStr = null;
      if (argumentsJson != null && !argumentsJson.isBlank() && !argumentsJson.equals("{}")) {
        JsonNode jsonNode = objectMapper.readTree(argumentsJson);
        if (jsonNode.has("workspaceId")) {
          workspaceIdStr = jsonNode.get("workspaceId").asText();
        }
      }

      UUID wsUuid;
      try {
        wsUuid = UUID.fromString(workspaceIdStr);
      } catch (Exception e) {
        wsUuid =
            com.assistant.kernel.context.WorkspaceContextHolder.get()
                .map(com.assistant.kernel.domain.WorkspaceId::value)
                .orElseGet(UUID::randomUUID);
      }

      com.assistant.kernel.domain.WorkspaceId wsId =
          new com.assistant.kernel.domain.WorkspaceId(wsUuid);
      Object notes = noteService.listNotes(wsId);
      return ToolExecutionResult.ok("Notes retrieved: " + objectMapper.writeValueAsString(notes));
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute list_notes tool: " + e.getMessage());
    }
  }
}
