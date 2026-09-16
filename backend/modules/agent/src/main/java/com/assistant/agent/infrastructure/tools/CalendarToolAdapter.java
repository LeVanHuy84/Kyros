package com.assistant.agent.infrastructure.tools;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.time.Instant;
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
    return "create_event";
  }

  @Override
  public String getDescription() {
    return "Schedule a calendar event in the workspace calendar.";
  }

  @Override
  public String getJsonSchema() {
    return """
        {
          "type": "object",
          "properties": {
            "workspaceId": { "type": "string" },
            "title": { "type": "string" },
            "description": { "type": "string" },
            "startTime": { "type": "string" },
            "endTime": { "type": "string" }
          },
          "required": ["workspaceId", "title", "startTime", "endTime"]
        }
        """;
  }

  @Override
  public ToolExecutionResult execute(String argumentsJson) {
    try {
      JsonNode jsonNode = objectMapper.readTree(argumentsJson);
      String workspaceIdStr = jsonNode.get("workspaceId").asText();
      String title = jsonNode.get("title").asText();
      String description = jsonNode.has("description") ? jsonNode.get("description").asText() : "";
      Instant startTime = parseDateTime(jsonNode.get("startTime").asText());
      Instant endTime = parseDateTime(jsonNode.has("endTime") ? jsonNode.get("endTime").asText() : null);
      if (endTime == null) {
        endTime = startTime.plus(java.time.Duration.ofHours(1));
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
        wsUuid = com.assistant.kernel.context.WorkspaceContextHolder.get()
            .map(com.assistant.kernel.domain.WorkspaceId::value)
            .orElseGet(UUID::randomUUID);
      }
      Object wsIdObj = wsConst.newInstance(wsUuid);
      String dummyUserId = UUID.randomUUID().toString();

      Object result = createMethod.invoke(calendarService, wsIdObj, dummyUserId, null, title, description, startTime, endTime, null);
      return ToolExecutionResult.ok("Calendar event scheduled successfully: " + result.toString());
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute create_event tool: " + e.getMessage());
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
