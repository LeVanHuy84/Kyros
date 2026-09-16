package com.assistant.agent.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.assistant.agent.domain.model.AgentExecutionResult;
import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.agent.infrastructure.llm.OpenAiCompatibleLlmClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ReActOrchestratorServiceTest {

  private ReActOrchestratorService orchestratorService;

  @BeforeEach
  void setUp() {
    AgentToolContract mockNoteTool =
        new AgentToolContract() {
          @Override
          public String getName() {
            return "create_note";
          }

          @Override
          public String getDescription() {
            return "Mock Note Tool";
          }

          @Override
          public String getJsonSchema() {
            return "{}";
          }

          @Override
          public ToolExecutionResult execute(String argumentsJson) {
            return ToolExecutionResult.ok("Created Note Mock");
          }
        };

    OpenAiCompatibleLlmClient mockClient = new OpenAiCompatibleLlmClient(new ObjectMapper());
    orchestratorService = new ReActOrchestratorService(List.of(mockNoteTool), mockClient);
  }

  @Test
  void shouldProcessNormalPromptAndExecuteTool() {
    UUID workspaceId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();

    AgentExecutionResult result =
        orchestratorService.processUserPrompt(workspaceId, userId, "Tạo note làm việc mới");

    assertNotNull(result);
    assertFalse(result.pendingApproval());
    assertEquals(1, result.turns().size());
    assertTrue(result.finalAnswer().contains("Created Note Mock"));
  }

  @Test
  void shouldInterceptDestructiveActionForHumanApproval() {
    UUID workspaceId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();

    AgentExecutionResult result =
        orchestratorService.processUserPrompt(workspaceId, userId, "Xóa lịch họp tuần này");

    assertNotNull(result);
    assertTrue(result.pendingApproval());
    assertEquals("delete_event", result.pendingToolName());
    assertNotNull(result.approvalReason());
  }
}
