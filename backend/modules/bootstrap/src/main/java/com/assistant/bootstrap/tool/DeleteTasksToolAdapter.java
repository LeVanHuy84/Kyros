package com.assistant.bootstrap.tool;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.application.port.in.TodoPort;
import com.assistant.todo.domain.model.TaskId;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class DeleteTasksToolAdapter implements AgentToolContract {

  private final TodoPort todoPort;
  private final ObjectMapper objectMapper;

  public DeleteTasksToolAdapter(TodoPort todoPort, ObjectMapper objectMapper) {
    this.todoPort = todoPort;
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "delete_tasks";
  }

  @Override
  public String getDescription() {
    return "Xóa một hoặc nhiều công việc (Tasks) dựa vào danh sách ID.";
  }

  @Override
  public String getJsonSchema() {
    return """
    {
      "type": "object",
      "properties": {
        "workspaceId": { "type": "string" },
        "taskIds": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Danh sách các ID của task cần xóa"
        }
      },
      "required": ["taskIds"]
    }
    """;
  }

  @Override
  public ToolExecutionResult execute(String argumentsJson) {
    try {
      JsonNode jsonNode = objectMapper.readTree(argumentsJson);
      String workspaceIdStr =
          jsonNode.has("workspaceId") ? jsonNode.get("workspaceId").asText() : "";
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

      JsonNode idsNode = jsonNode.has("taskIds") ? jsonNode.get("taskIds") : jsonNode.get("ids");
      List<String> ids = new ArrayList<>();
      if (idsNode != null && idsNode.isArray()) {
        for (JsonNode n : idsNode) {
          ids.add(n.asText());
        }
      } else if (jsonNode.has("taskId")) {
        ids.add(jsonNode.get("taskId").asText());
      } else if (jsonNode.has("id")) {
        ids.add(jsonNode.get("id").asText());
      }

      int deletedCount = 0;
      for (String idStr : ids) {
        try {
          TaskId taskId = TaskId.fromString(idStr);
          todoPort.softDeleteTask(taskId, workspaceId);
          deletedCount++;
        } catch (Exception ignored) {
          // skip not found
        }
      }

      return ToolExecutionResult.ok(
          "Đã xóa thành công " + deletedCount + " công việc (" + String.join(", ", ids) + ").");
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute delete_tasks tool: " + e.getMessage());
    }
  }
}
