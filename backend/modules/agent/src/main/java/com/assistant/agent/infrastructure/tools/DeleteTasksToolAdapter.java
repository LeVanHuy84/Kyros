package com.assistant.agent.infrastructure.tools;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class DeleteTasksToolAdapter implements AgentToolContract {

  private final ObjectMapper objectMapper;

  public DeleteTasksToolAdapter(ObjectMapper objectMapper) {
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

      return ToolExecutionResult.ok(
          "Đã xóa thành công " + ids.size() + " công việc: " + String.join(", ", ids));
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute delete_tasks tool: " + e.getMessage());
    }
  }
}
