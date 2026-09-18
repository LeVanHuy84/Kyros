package com.assistant.agent.infrastructure.tools;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class CalendarToolAdapter implements AgentToolContract {

  private final ApplicationContext applicationContext;
  private final ObjectMapper objectMapper;

  public CalendarToolAdapter(ApplicationContext applicationContext, ObjectMapper objectMapper) {
    this.applicationContext = applicationContext;
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

      Object calendarService = applicationContext.getBean("calendarEventService");
      Method createMethod = null;
      for (Method m : calendarService.getClass().getMethods()) {
        if (m.getName().equals("createEvent")) {
          createMethod = m;
          break;
        }
      }

      if (createMethod == null) {
        return ToolExecutionResult.error("CalendarEventService createEvent method not found");
      }

      Class<?> wsIdClass = Class.forName("com.assistant.kernel.domain.WorkspaceId");
      Constructor<?> wsConst = wsIdClass.getConstructor(UUID.class);
      UUID wsUuid;
      try {
        wsUuid = UUID.fromString(workspaceIdStr);
      } catch (Exception e) {
        wsUuid =
            com.assistant.kernel.context.WorkspaceContextHolder.get()
                .map(com.assistant.kernel.domain.WorkspaceId::value)
                .orElseGet(UUID::randomUUID);
      }
      Object wsIdObj = wsConst.newInstance(wsUuid);
      String dummyUserId = UUID.randomUUID().toString();

      List<String> results = new ArrayList<>();
      for (JsonNode eventItem : eventsNode) {
        String title = eventItem.has("title") ? eventItem.get("title").asText() : "Sự kiện mới";
        String description =
            eventItem.has("description") ? eventItem.get("description").asText() : "";
        Instant startTime =
            parseDateTime(eventItem.has("startTime") ? eventItem.get("startTime").asText() : null);
        Instant endTime =
            parseDateTime(eventItem.has("endTime") ? eventItem.get("endTime").asText() : null);
        if (startTime == null) {
          startTime = Instant.now().plus(java.time.Duration.ofHours(1));
        }
        if (endTime == null) {
          endTime = startTime.plus(java.time.Duration.ofHours(1));
        }

        createMethod.invoke(
            calendarService,
            wsIdObj,
            dummyUserId,
            null,
            title,
            description,
            startTime,
            endTime,
            null);
        results.add(title + " (" + startTime.toString() + ")");
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
        return java.time.LocalDate.now(java.time.ZoneId.systemDefault())
            .atTime(time)
            .atZone(java.time.ZoneId.systemDefault())
            .toInstant();
      } catch (Exception e2) {
        try {
          java.time.LocalDateTime ldt = java.time.LocalDateTime.parse(text);
          return ldt.atZone(java.time.ZoneId.systemDefault()).toInstant();
        } catch (Exception e3) {
          return Instant.now().plus(java.time.Duration.ofHours(1));
        }
      }
    }
  }
}
