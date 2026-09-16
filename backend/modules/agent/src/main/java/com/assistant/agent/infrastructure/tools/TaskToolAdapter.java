package com.assistant.agent.infrastructure.tools;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
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
    return "create_task";
  }

  @Override
  public String getDescription() {
    return "Create a new task in the workspace todo list.";
  }

  @Override
  public String getJsonSchema() {
    return """
        {
          "type": "object",
          "properties": {
            "workspaceId": { "type": "string" },
            "userId": { "type": "string" },
            "title": { "type": "string" },
            "description": { "type": "string" }
          },
          "required": ["workspaceId", "userId", "title"]
        }
        """;
  }

  @Override
  public ToolExecutionResult execute(String argumentsJson) {
    try {
      JsonNode jsonNode = objectMapper.readTree(argumentsJson);
      String workspaceIdStr = jsonNode.get("workspaceId").asText();
      String userIdStr = jsonNode.get("userId").asText();
      String title = jsonNode.get("title").asText();
      String description = jsonNode.has("description") ? jsonNode.get("description").asText() : "";

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
      Class<?> uIdClass = Class.forName("com.assistant.kernel.domain.UserId");

      Constructor<?> wsConst = wsIdClass.getConstructor(UUID.class);
      Constructor<?> uConst = uIdClass.getConstructor(UUID.class);

      UUID wsUuid;
      try {
        wsUuid = UUID.fromString(workspaceIdStr);
      } catch (Exception e) {
        wsUuid = com.assistant.kernel.context.WorkspaceContextHolder.get()
            .map(com.assistant.kernel.domain.WorkspaceId::value)
            .orElseGet(UUID::randomUUID);
      }

      UUID uUuid;
      try {
        uUuid = UUID.fromString(userIdStr);
      } catch (Exception e) {
        uUuid = UUID.randomUUID();
      }

      Object wsIdObj = wsConst.newInstance(wsUuid);
      Object uIdObj = uConst.newInstance(uUuid);

      Object result = createMethod.invoke(todoService, wsIdObj, uIdObj, title, description, null, null, null);
      return ToolExecutionResult.ok("Task created successfully: " + result.toString());
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute create_task tool: " + e.getMessage());
    }
  }
}
