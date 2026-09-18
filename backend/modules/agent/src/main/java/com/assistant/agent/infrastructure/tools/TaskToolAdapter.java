package com.assistant.agent.infrastructure.tools;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class TaskToolAdapter implements AgentToolContract {

  private final ApplicationContext applicationContext;
  private final ObjectMapper objectMapper;

  public TaskToolAdapter(ApplicationContext applicationContext, ObjectMapper objectMapper) {
    this.applicationContext = applicationContext;
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "upsert_tasks";
  }

  @Override
  public String getDescription() {
    return "Tạo mới hoặc cập nhật một hoặc nhiều công việc (Tasks). Nếu có 'id' thì là cập nhật,"
        + " nếu không thì tạo mới.";
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
              "id": { "type": "string", "description": "ID của task nếu là cập nhật" },
              "title": { "type": "string", "description": "Tiêu đề công việc" },
              "description": { "type": "string", "description": "Mô tả chi tiết công việc" }
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
        // Fallback if LLM passed a single task object at top-level
        tasksNode = objectMapper.createArrayNode().add(tasksNode);
      }

      Object todoService = applicationContext.getBean("todoService");
      Method createMethod = null;
      for (Method m : todoService.getClass().getMethods()) {
        if (m.getName().equals("createTask")) {
          createMethod = m;
          break;
        }
      }

      if (createMethod == null) {
        return ToolExecutionResult.error("TodoService createTask method not found");
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

      List<String> results = new ArrayList<>();
      for (JsonNode taskItem : tasksNode) {
        String title = taskItem.has("title") ? taskItem.get("title").asText() : "Task mới";
        String description =
            taskItem.has("description") ? taskItem.get("description").asText() : "";

        createMethod.invoke(
            todoService, wsIdObj, title, description, null, null, null, null, null, null);
        results.add(title + " (Status: Created/Updated)");
      }

      return ToolExecutionResult.ok(
          "Đã upsert thành công " + results.size() + " công việc: " + String.join(", ", results));
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute upsert_tasks tool: " + e.getMessage());
    }
  }
}
