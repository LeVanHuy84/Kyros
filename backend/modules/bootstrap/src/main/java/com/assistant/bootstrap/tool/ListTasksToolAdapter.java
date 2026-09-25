package com.assistant.bootstrap.tool;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.application.port.in.TodoPort;
import com.assistant.todo.domain.model.Task;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

@Component
public class ListTasksToolAdapter implements AgentToolContract {

  private final TodoPort todoPort;
  private final ObjectMapper objectMapper;

  public ListTasksToolAdapter(TodoPort todoPort, ObjectMapper objectMapper) {
    this.todoPort = todoPort;
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "list_tasks";
  }

  @Override
  public String getDescription() {
    return "List tasks in the workspace to view pending or existing tasks.";
  }

  @Override
  public String getJsonSchema() {
    return """
    {
      "type": "object",
      "properties": {
        "workspaceId": { "type": "string" },
        "title": { "type": "string" }
      },
      "required": []
    }
    """;
  }

  @Override
  public ToolExecutionResult execute(String argumentsJson) {
    try {
      String workspaceIdStr = null;
      String title = null;
      if (argumentsJson != null && !argumentsJson.isBlank() && !argumentsJson.equals("{}")) {
        JsonNode jsonNode = objectMapper.readTree(argumentsJson);
        if (jsonNode.has("workspaceId")) {
          workspaceIdStr = jsonNode.get("workspaceId").asText();
        }
        if (jsonNode.has("title")) {
          title = jsonNode.get("title").asText();
        }
      }

      UUID wsUuid;
      try {
        wsUuid = UUID.fromString(workspaceIdStr);
      } catch (Exception e) {
        wsUuid =
            com.assistant.kernel.context.WorkspaceContextHolder.get()
                .map(WorkspaceId::value)
                .orElseGet(UUID::randomUUID);
      }
      WorkspaceId workspaceId = new WorkspaceId(wsUuid);

      Page<Task> page =
          todoPort.listTasks(
              workspaceId, title, null, null, false, null, null, PageRequest.of(0, 20));

      StringBuilder formatted = new StringBuilder();
      for (Task t : page.getContent()) {
        formatted
            .append("- Task: \"")
            .append(t.getTitle())
            .append("\" (ID: ")
            .append(t.getId().value())
            .append(") | Độ ưu tiên: ")
            .append(t.getPriority())
            .append(" | Hạn: ")
            .append(t.getDueDate() != null ? t.getDueDate().toString() : "Không")
            .append("\n");
      }

      String output =
          formatted.length() > 0
              ? "Danh sách công việc đang chờ xử lý:\n" + formatted.toString()
              : "Không có công việc nào đang chờ xử lý.";

      return ToolExecutionResult.ok(output);
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute list_tasks tool: " + e.getMessage());
    }
  }
}
