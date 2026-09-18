package com.assistant.agent.infrastructure.tools;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class ListEventsToolAdapter implements AgentToolContract {

  private final ApplicationContext applicationContext;
  private final ObjectMapper objectMapper;

  public ListEventsToolAdapter(ApplicationContext applicationContext, ObjectMapper objectMapper) {
    this.applicationContext = applicationContext;
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
      java.time.ZoneId vnZone = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
      java.time.ZonedDateTime nowVn = java.time.ZonedDateTime.now(vnZone);
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
          }
        }
        if (jsonNode.has("endTime") && !jsonNode.get("endTime").asText().isBlank()) {
          try {
            endTime = Instant.parse(jsonNode.get("endTime").asText());
          } catch (Exception ignored) {
          }
        }
      }

      Object calendarService = applicationContext.getBean("calendarEventService");
      Method listMethod = null;
      for (Method m : calendarService.getClass().getMethods()) {
        if (m.getName().equals("listEvents")) {
          listMethod = m;
          break;
        }
      }

      if (listMethod == null) {
        return ToolExecutionResult.error("CalendarEventService listEvents method not found");
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

      Object result = listMethod.invoke(calendarService, wsIdObj, startTime, endTime);

      // Format timestamps clearly into Vietnam Local Time for LLM so it never confuses UTC ISO
      // string
      String rawJson = objectMapper.writeValueAsString(result);
      JsonNode eventsNode = objectMapper.readTree(rawJson);
      java.time.format.DateTimeFormatter fmt =
          java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm (EEEE, 'múi giờ' z)");

      StringBuilder formattedOutput = new StringBuilder();
      if (eventsNode.isArray()) {
        for (JsonNode ev : eventsNode) {
          String title = ev.path("title").asText();
          String startUtcStr = ev.path("startTime").asText();
          String endUtcStr = ev.path("endTime").asText();
          String status = ev.path("status").asText();

          String startVn = startUtcStr;
          String endVn = endUtcStr;
          try {
            startVn = Instant.parse(startUtcStr).atZone(vnZone).format(fmt);
            endVn = Instant.parse(endUtcStr).atZone(vnZone).format(fmt);
          } catch (Exception ignored) {
          }

          formattedOutput
              .append("- Sự kiện: \"")
              .append(title)
              .append("\" | Bắt đầu (Giờ VN): ")
              .append(startVn)
              .append(" | Kết thúc (Giờ VN): ")
              .append(endVn)
              .append(" | Trạng thái: ")
              .append(status)
              .append("\n");
        }
      }

      String finalResultStr = formattedOutput.length() > 0 ? formattedOutput.toString() : rawJson;
      return ToolExecutionResult.ok("Danh sách sự kiện (Giờ Việt Nam UTC+7):\n" + finalResultStr);
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute list_events tool: " + e.getMessage());
    }
  }
}
