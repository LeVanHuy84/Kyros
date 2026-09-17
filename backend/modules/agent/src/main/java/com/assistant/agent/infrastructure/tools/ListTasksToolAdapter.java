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
public class ListTasksToolAdapter implements AgentToolContract {

  private final ApplicationContext applicationContext;
  private final ObjectMapper objectMapper;

  public ListTasksToolAdapter(ApplicationContext applicationContext, ObjectMapper objectMapper) {
    this.applicationContext = applicationContext;
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "list_tasks";
  }

  @Override
  public String getDescription() {
    return "List tasks in the workspace to view pending or existing tasks.";
  }

  @Override
  public String getJsonSchema() {
    return """
        {
          "type": "object",
          "properties": {
            "workspaceId": { "type": "string" },
            "title": { "type": "string" }
          },
          "required": []
        }
        """;
  }

  @Override
  public ToolExecutionResult execute(String argumentsJson) {
    try {
      String workspaceIdStr = null;
      String title = null;
      if (argumentsJson != null && !argumentsJson.isBlank() && !argumentsJson.equals("{}")) {
        JsonNode jsonNode = objectMapper.readTree(argumentsJson);
        if (jsonNode.has("workspaceId")) {
          workspaceIdStr = jsonNode.get("workspaceId").asText();
        }
        if (jsonNode.has("title")) {
          title = jsonNode.get("title").asText();
        }
      }

      Object todoService = applicationContext.getBean("todoService");
      Method listMethod = null;
      for (Method m : todoService.getClass().getMethods()) {
        if (m.getName().equals("listTasks")) {
          listMethod = m;
          break;
        }
      }

      if (listMethod == null) {
        return ToolExecutionResult.error("TodoService listTasks method not found");
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

      Class<?> pageReqClass = Class.forName("org.springframework.data.domain.PageRequest");
      Method ofMethod = pageReqClass.getMethod("of", int.class, int.class);
      Object pageable = ofMethod.invoke(null, 0, 10);

      Object result = listMethod.invoke(todoService, wsIdObj, title, null, null, null, null, null, pageable);
      return ToolExecutionResult.ok("Tasks retrieved: " + objectMapper.writeValueAsString(result));
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute list_tasks tool: " + e.getMessage());
    }
  }
}
