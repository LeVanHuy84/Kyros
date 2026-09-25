package com.assistant.bootstrap.tool;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.calendar.application.port.in.CalendarPort;
import com.assistant.calendar.domain.model.EventId;
import com.assistant.kernel.domain.WorkspaceId;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class CalendarToolAdapter implements AgentToolContract {

  private final CalendarPort calendarPort;
  private final ObjectMapper objectMapper;

  public CalendarToolAdapter(CalendarPort calendarPort, ObjectMapper objectMapper) {
    this.calendarPort = calendarPort;
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "upsert_events";
  }

  @Override
  public String getDescription() {
    return "Tạo mới hoặc cập nhật một hoặc nhiều sự kiện trên lịch (Calendar Events). Nếu có 'id'"
        + " thì là cập nhật, không có 'id' thì tạo mới.";
  }

  @Override
  public String getJsonSchema() {
    return """
    {
      "type": "object",
      "properties": {
        "workspaceId": { "type": "string" },
        "events": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string", "description": "ID sự kiện nếu là cập nhật" },
              "title": { "type": "string", "description": "Tiêu đề sự kiện" },
              "description": { "type": "string", "description": "Mô tả chi tiết" },
              "startTime": { "type": "string", "description": "Thời gian bắt đầu (ISO-8601 hoặc HH:mm)" },
              "endTime": { "type": "string", "description": "Thời gian kết thúc (ISO-8601 hoặc HH:mm)" }
            },
            "required": ["title", "startTime"]
          }
        }
      },
      "required": ["events"]
    }
    """;
  }

  @Override
  public ToolExecutionResult execute(String argumentsJson) {
    try {
      JsonNode jsonNode = objectMapper.readTree(argumentsJson);
      String workspaceIdStr =
          jsonNode.has("workspaceId") ? jsonNode.get("workspaceId").asText() : "";

      JsonNode eventsNode = jsonNode.has("events") ? jsonNode.get("events") : jsonNode;
      if (!eventsNode.isArray()) {
        eventsNode = objectMapper.createArrayNode().add(eventsNode);
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
      String dummyUserId = UUID.randomUUID().toString();

      List<String> results = new ArrayList<>();
      for (JsonNode eventItem : eventsNode) {
        String title = eventItem.has("title") ? eventItem.get("title").asText() : "Sự kiện mới";
        String description =
            eventItem.has("description") ? eventItem.get("description").asText() : "";
        Instant rawStartTime =
            parseDateTime(eventItem.has("startTime") ? eventItem.get("startTime").asText() : null);
        Instant rawEndTime =
            parseDateTime(eventItem.has("endTime") ? eventItem.get("endTime").asText() : null);
        final Instant effStartTime =
            rawStartTime != null
                ? rawStartTime
                : Instant.now().plus(java.time.Duration.ofHours(1));
        final Instant effEndTime =
            rawEndTime != null ? rawEndTime : effStartTime.plus(java.time.Duration.ofHours(1));

        // De-duplication check: avoid creating duplicate identical events
        var existingInWindow =
            calendarPort.listEvents(
                workspaceId,
                effStartTime.minus(java.time.Duration.ofMinutes(1)),
                effEndTime.plus(java.time.Duration.ofMinutes(1)));
        var duplicateOpt =
            existingInWindow.stream()
                .filter(
                    e ->
                        "Scheduled".equalsIgnoreCase(e.status())
                            && e.title().equalsIgnoreCase(title)
                            && Math.abs(
                                    java.time.Duration.between(e.startTime(), effStartTime)
                                        .toMinutes())
                                <= 5)
                .findFirst();

        if (duplicateOpt.isPresent()) {
          results.add(
              title
                  + " (ID: "
                  + duplicateOpt.get().eventId()
                  + " lúc "
                  + duplicateOpt.get().startTime().toString()
                  + ")");
          continue;
        }

        EventId eventId =
            calendarPort.createEvent(
                workspaceId,
                dummyUserId,
                null,
                title,
                description,
                effStartTime,
                effEndTime,
                List.of(15));
        results.add(title + " (ID: " + eventId.value() + " lúc " + effStartTime.toString() + ")");
      }

      return ToolExecutionResult.ok(
          "Đã lên lịch thành công " + results.size() + " sự kiện: " + String.join(", ", results));
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute upsert_events tool: " + e.getMessage());
    }
  }

  private Instant parseDateTime(String text) {
    if (text == null || text.isBlank()) {
      return null;
    }
    try {
      return Instant.parse(text);
    } catch (Exception e1) {
      try {
        java.time.LocalTime time = java.time.LocalTime.parse(text);
        return java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"))
            .atTime(time)
            .atZone(java.time.ZoneId.of("Asia/Ho_Chi_Minh"))
            .toInstant();
      } catch (Exception e2) {
        try {
          java.time.LocalDateTime ldt = java.time.LocalDateTime.parse(text);
          return ldt.atZone(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
        } catch (Exception e3) {
          return Instant.now().plus(java.time.Duration.ofHours(1));
        }
      }
    }
  }
}
