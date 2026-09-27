package com.assistant.bootstrap.tool;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.calendar.application.port.in.CalendarPort;
import com.assistant.calendar.domain.model.EventId;
import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.WorkspaceId;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Tool adapter for deleting calendar events (Human-in-the-loop protected). */
@Component
public class DeleteEventsToolAdapter implements AgentToolContract {

  private final CalendarPort calendarPort;
  private final ObjectMapper objectMapper;

  public DeleteEventsToolAdapter(CalendarPort calendarPort, ObjectMapper objectMapper) {
    this.calendarPort = calendarPort;
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
        },
        "id": { "type": "string", "description": "ID nếu xóa 1 sự kiện duy nhất" }
      }
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
        wsUuid = WorkspaceContextHolder.get().map(WorkspaceId::value).orElseGet(UUID::randomUUID);
      }
      WorkspaceId workspaceId = new WorkspaceId(wsUuid);

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

      int deletedCount = 0;
      for (String idStr : ids) {
        try {
          EventId eventId = new EventId(UUID.fromString(idStr));
          calendarPort.deleteEvent(workspaceId, eventId);
          deletedCount++;
        } catch (Exception ignored) {
        }
      }

      return ToolExecutionResult.ok(
          "Đã xóa thành công " + deletedCount + " sự kiện lịch (" + String.join(", ", ids) + ").");
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute delete_events tool: " + e.getMessage());
    }
  }
}
