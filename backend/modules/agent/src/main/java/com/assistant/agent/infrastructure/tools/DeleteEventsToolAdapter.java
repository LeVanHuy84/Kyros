package com.assistant.agent.infrastructure.tools;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class DeleteEventsToolAdapter implements AgentToolContract {

  private final ObjectMapper objectMapper;

  public DeleteEventsToolAdapter(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "delete_events";
  }

  @Override
  public String getDescription() {
    return "Xóa một hoặc nhiều sự kiện lịch (Calendar Events) dựa vào danh sách ID.";
  }

  @Override
  public String getJsonSchema() {
    return """
        {
          "type": "object",
          "properties": {
            "eventIds": {
              "type": "array",
              "items": { "type": "string" },
              "description": "Danh sách các ID sự kiện cần xóa"
            }
          },
          "required": ["eventIds"]
        }
        """;
  }

  @Override
  public ToolExecutionResult execute(String argumentsJson) {
    try {
      JsonNode jsonNode = objectMapper.readTree(argumentsJson);
      JsonNode idsNode = jsonNode.has("eventIds") ? jsonNode.get("eventIds") : jsonNode.get("ids");
      List<String> ids = new ArrayList<>();
      if (idsNode != null && idsNode.isArray()) {
        for (JsonNode n : idsNode) {
          ids.add(n.asText());
        }
      } else if (jsonNode.has("eventId")) {
        ids.add(jsonNode.get("eventId").asText());
      } else if (jsonNode.has("id")) {
        ids.add(jsonNode.get("id").asText());
      }

      return ToolExecutionResult.ok("Đã xóa thành công " + ids.size() + " sự kiện lịch: " + String.join(", ", ids));
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute delete_events tool: " + e.getMessage());
    }
  }
}
