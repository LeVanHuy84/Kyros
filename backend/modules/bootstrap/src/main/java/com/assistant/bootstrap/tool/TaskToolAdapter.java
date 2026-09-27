package com.assistant.bootstrap.tool;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.application.port.in.TodoPort;
import com.assistant.todo.domain.model.Priority;
import com.assistant.todo.domain.model.Task;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Token-efficient Task tool adapter for creating or updating actionable to-dos. */
@Component
public class TaskToolAdapter implements AgentToolContract {

  private final TodoPort todoPort;
  private final ObjectMapper objectMapper;

  public TaskToolAdapter(TodoPort todoPort, ObjectMapper objectMapper) {
    this.todoPort = todoPort;
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "upsert_tasks";
  }

  @Override
  public String getDescription() {
    return "Create or update one or more tasks with deadlines and priority levels.";
  }

  @Override
  public String getJsonSchema() {
    return """
    {
      "type": "object",
      "properties": {
        "tasks": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string", "description": "Optional task ID if updating" },
              "title": { "type": "string", "description": "Task title" },
              "description": { "type": "string", "description": "Detailed description of the task" },
              "dueDate": { "type": "string", "description": "Due date/deadline in ISO-8601 format (e.g. 2026-09-30T17:00:00Z or 2026-09-30)" },
              "priority": { "type": "string", "description": "Low, Medium, High, or Critical" }
            },
            "required": ["title"]
          }
        }
      },
      "required": ["tasks"]
    }
    """;
  }

  @Override
  public ToolExecutionResult execute(String argumentsJson) {
    try {
      JsonNode jsonNode = objectMapper.readTree(argumentsJson);
      String workspaceIdStr =
          jsonNode.has("workspaceId") ? jsonNode.get("workspaceId").asText() : "";

      JsonNode tasksNode = jsonNode.has("tasks") ? jsonNode.get("tasks") : jsonNode;
      if (!tasksNode.isArray()) {
        tasksNode = objectMapper.createArrayNode().add(tasksNode);
      }

      UUID wsUuid;
      try {
        wsUuid = UUID.fromString(workspaceIdStr);
      } catch (Exception e) {
        wsUuid = WorkspaceContextHolder.get().map(WorkspaceId::value).orElseGet(UUID::randomUUID);
      }
      WorkspaceId workspaceId = new WorkspaceId(wsUuid);

      List<String> results = new ArrayList<>();
      for (JsonNode taskItem : tasksNode) {
        String title = extractField(taskItem, "title", "name", "task_title", "task");
        if (title == null || title.isBlank()) {
          title = "Task mới";
        }
        String description =
            extractField(taskItem, "description", "details", "desc", "content", "notes");
        if (description == null) {
          description = "";
        }

        String priorityRaw = extractField(taskItem, "priority", "level", "priority_level");
        Priority priority = parsePriority(priorityRaw);

        String dueDateRaw =
            extractField(
                taskItem,
                "dueDate",
                "due_date",
                "deadline",
                "due",
                "dueAt",
                "due_at",
                "date",
                "endTime");
        Instant dueDate = parseDateTime(dueDateRaw);

        Task task =
            todoPort.createTask(
                workspaceId, title, description, priority, dueDate, null, null, null, null);
        String dueInfo = dueDate != null ? " (Hạn: " + dueDate.toString() + ")" : "";
        results.add(task.getTitle() + dueInfo + " [ID: " + task.getId().value() + "]");
      }

      return ToolExecutionResult.ok(
          "Đã tạo thành công " + results.size() + " công việc: " + String.join(", ", results));
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute upsert_tasks tool: " + e.getMessage());
    }
  }

  private String extractField(JsonNode node, String... fieldNames) {
    for (String fn : fieldNames) {
      if (node.has(fn) && !node.get(fn).isNull()) {
        String val = node.get(fn).asText();
        if (val != null && !val.isBlank()) {
          return val.trim();
        }
      }
    }
    return null;
  }

  private Priority parsePriority(String text) {
    if (text == null || text.isBlank()) {
      return Priority.Medium;
    }
    String lower = text.trim().toLowerCase(java.util.Locale.ROOT);
    if (lower.contains("crit")
        || lower.contains("khẩn")
        || lower.contains("urgent")
        || lower.contains("high")
        || lower.contains("cao")) {
      return Priority.High;
    }
    if (lower.contains("low") || lower.contains("thấp")) {
      return Priority.Low;
    }
    return Priority.Medium;
  }

  private Instant parseDateTime(String text) {
    if (text == null || text.isBlank()) {
      return null;
    }
    String trimmed = text.trim();
    try {
      return Instant.parse(trimmed);
    } catch (Exception ignored) {
    }
    try {
      return java.time.OffsetDateTime.parse(trimmed).toInstant();
    } catch (Exception ignored) {
    }
    try {
      return java.time.ZonedDateTime.parse(trimmed).toInstant();
    } catch (Exception ignored) {
    }
    try {
      java.time.LocalDateTime ldt = java.time.LocalDateTime.parse(trimmed);
      return ldt.atZone(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
    } catch (Exception ignored) {
    }
    try {
      java.time.LocalDate ld = java.time.LocalDate.parse(trimmed);
      return ld.atTime(18, 0).atZone(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
    } catch (Exception ignored) {
    }
    try {
      var nlp = com.assistant.agent.domain.nlp.NaturalDateTimeParser.parse(trimmed);
      if (nlp.hasExplicitDate() || nlp.hasExplicitTime()) {
        return nlp.startTime().toInstant();
      }
    } catch (Exception ignored) {
    }
    return null;
  }
}
