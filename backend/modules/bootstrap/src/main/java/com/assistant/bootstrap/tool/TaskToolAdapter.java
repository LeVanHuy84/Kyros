package com.assistant.bootstrap.tool;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
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
    return "Create or update one or more tasks. If 'id' is provided, update existing task;"
        + " otherwise create a new task.";
  }

  @Override
  public String getJsonSchema() {
    return """
    {
      "type": "object",
      "properties": {
        "workspaceId": { "type": "string" },
        "userId": { "type": "string" },
        "tasks": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string", "description": "Task ID if updating an existing task" },
              "title": { "type": "string", "description": "Task title" },
              "description": { "type": "string", "description": "Detailed description of the task" },
              "dueDate": { "type": "string", "description": "Due date in ISO-8601 format" },
              "priority": { "type": "string", "description": "Priority level: Low, Medium, High, Critical" }
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
        wsUuid =
            com.assistant.kernel.context.WorkspaceContextHolder.get()
                .map(WorkspaceId::value)
                .orElseGet(UUID::randomUUID);
      }
      WorkspaceId workspaceId = new WorkspaceId(wsUuid);

      List<String> results = new ArrayList<>();
      for (JsonNode taskItem : tasksNode) {
        String title = taskItem.has("title") ? taskItem.get("title").asText() : "Task mới";
        String description =
            taskItem.has("description") ? taskItem.get("description").asText() : "";
        Priority priority = Priority.Medium;
        if (taskItem.has("priority")) {
          try {
            priority = Priority.valueOf(taskItem.get("priority").asText());
          } catch (Exception ignored) {
            // keep default
          }
        }
        Instant dueDate = null;
        if (taskItem.has("dueDate") && !taskItem.get("dueDate").asText().isBlank()) {
          try {
            dueDate = Instant.parse(taskItem.get("dueDate").asText());
          } catch (Exception ignored) {
            // keep null
          }
        }

        Task task =
            todoPort.createTask(
                workspaceId, title, description, priority, dueDate, null, null, null, null);
        results.add(task.getTitle() + " (ID: " + task.getId().value() + ")");
      }

      return ToolExecutionResult.ok(
          "Đã tạo thành công " + results.size() + " công việc: " + String.join(", ", results));
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute upsert_tasks tool: " + e.getMessage());
    }
  }
}
