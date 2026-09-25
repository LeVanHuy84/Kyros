package com.assistant.bootstrap.tool;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.calendar.application.port.in.CalendarEventDto;
import com.assistant.calendar.application.port.in.CalendarPort;
import com.assistant.kernel.domain.WorkspaceId;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class ListEventsToolAdapter implements AgentToolContract {

  private final CalendarPort calendarPort;
  private final ObjectMapper objectMapper;

  public ListEventsToolAdapter(CalendarPort calendarPort, ObjectMapper objectMapper) {
    this.calendarPort = calendarPort;
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "list_events";
  }

  @Override
  public String getDescription() {
    return "List calendar events in a time range to check schedules, meetings, or reminders.";
  }

  @Override
  public String getJsonSchema() {
    return """
    {
      "type": "object",
      "properties": {
        "workspaceId": { "type": "string" },
        "startTime": { "type": "string" },
        "endTime": { "type": "string" }
      },
      "required": []
    }
    """;
  }

  @Override
  public ToolExecutionResult execute(String argumentsJson) {
    try {
      String workspaceIdStr = null;
      ZoneId vnZone = ZoneId.of("Asia/Ho_Chi_Minh");
      ZonedDateTime nowVn = ZonedDateTime.now(vnZone);
      Instant startTime = nowVn.truncatedTo(ChronoUnit.DAYS).toInstant();
      Instant endTime = startTime.plus(7, ChronoUnit.DAYS);

      if (argumentsJson != null && !argumentsJson.isBlank() && !argumentsJson.equals("{}")) {
        JsonNode jsonNode = objectMapper.readTree(argumentsJson);
        if (jsonNode.has("workspaceId")) {
          workspaceIdStr = jsonNode.get("workspaceId").asText();
        }
        if (jsonNode.has("startTime") && !jsonNode.get("startTime").asText().isBlank()) {
          try {
            startTime = Instant.parse(jsonNode.get("startTime").asText());
          } catch (Exception ignored) {
            // keep default
          }
        }
        if (jsonNode.has("endTime") && !jsonNode.get("endTime").asText().isBlank()) {
          try {
            endTime = Instant.parse(jsonNode.get("endTime").asText());
          } catch (Exception ignored) {
            // keep default
          }
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

      List<CalendarEventDto> events = calendarPort.listEvents(workspaceId, startTime, endTime);

      DateTimeFormatter fmt =
          DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm (EEEE, 'múi giờ' z)");

      StringBuilder formattedOutput = new StringBuilder();
      for (CalendarEventDto ev : events) {
        String startVn = ev.startTime() != null ? ev.startTime().atZone(vnZone).format(fmt) : "";
        String endVn = ev.endTime() != null ? ev.endTime().atZone(vnZone).format(fmt) : "";

        formattedOutput
            .append("- Sự kiện: \"")
            .append(ev.title())
            .append("\" (ID: ")
            .append(ev.eventId())
            .append(") | Bắt đầu (Giờ VN): ")
            .append(startVn)
            .append(" | Kết thúc (Giờ VN): ")
            .append(endVn)
            .append(" | Trạng thái: ")
            .append(ev.status())
            .append("\n");
      }

      String finalResultStr =
          formattedOutput.length() > 0
              ? formattedOutput.toString()
              : "Không có sự kiện nào trong khoảng thời gian này.";

      return ToolExecutionResult.ok("Danh sách sự kiện (Giờ Việt Nam UTC+7):\n" + finalResultStr);
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute list_events tool: " + e.getMessage());
    }
  }
}
