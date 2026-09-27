package com.assistant.agent.infrastructure.tools;

import com.assistant.agent.domain.model.ToolExecutionResult;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.application.service.MemoryConsolidationService;
import com.assistant.memory.domain.model.ExtractedFact;
import com.assistant.memory.domain.model.FactCategory;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Tool adapter for explicitly saving long-term user preferences, work rules, and facts to Memory
 * Vault.
 */
@Component
public class SaveMemoryToolAdapter implements AgentToolContract {

  private final MemoryConsolidationService consolidationService;
  private final ObjectMapper objectMapper;

  public SaveMemoryToolAdapter(
      MemoryConsolidationService consolidationService, ObjectMapper objectMapper) {
    this.consolidationService = consolidationService;
    this.objectMapper = objectMapper;
  }

  @Override
  public String getName() {
    return "save_memory";
  }

  @Override
  public String getDescription() {
    return "Save or update a long-term fact, preference, habit, or work rule in the user's memory"
        + " vault.";
  }

  @Override
  public String getJsonSchema() {
    return """
    {
      "type": "object",
      "properties": {
        "facts": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "content": { "type": "string", "description": "The exact fact, rule, or preference statement" },
              "category": { "type": "string", "description": "USER_PREFERENCE, WORK_RULE, PROJECT_CONTEXT, or CONSTRAINT" },
              "confidenceScore": { "type": "number", "description": "Confidence score between 0.0 and 1.0" }
            },
            "required": ["content"]
          }
        },
        "content": { "type": "string", "description": "Single fact content to save" },
        "fact": { "type": "string", "description": "Alternative single fact key" },
        "category": { "type": "string", "description": "Category for single fact" }
      }
    }
    """;
  }

  @Override
  public ToolExecutionResult execute(String argumentsJson) {
    try {
      JsonNode jsonNode = objectMapper.readTree(argumentsJson);

      UUID wsUuid = null;
      if (jsonNode.has("workspaceId") && !jsonNode.get("workspaceId").asText().isBlank()) {
        try {
          wsUuid = UUID.fromString(jsonNode.get("workspaceId").asText());
        } catch (Exception ignored) {
        }
      }
      if (wsUuid == null) {
        wsUuid = WorkspaceContextHolder.get().map(WorkspaceId::value).orElseGet(UUID::randomUUID);
      }
      WorkspaceId workspaceId = new WorkspaceId(wsUuid);

      UUID uUuid = UUID.fromString("00000000-0000-0000-0000-000000000001");
      if (jsonNode.has("userId") && !jsonNode.get("userId").asText().isBlank()) {
        try {
          uUuid = UUID.fromString(jsonNode.get("userId").asText());
        } catch (Exception ignored) {
        }
      }
      UserId userId = new UserId(uUuid);

      List<ExtractedFact> factsToSave = new ArrayList<>();
      if (jsonNode.has("facts") && jsonNode.get("facts").isArray()) {
        for (JsonNode item : jsonNode.get("facts")) {
          String content = item.has("content") ? item.get("content").asText() : "";
          FactCategory cat =
              parseCategory(item.has("category") ? item.get("category").asText() : null);
          float score =
              item.has("confidenceScore") ? (float) item.get("confidenceScore").asDouble() : 0.90f;
          if (!content.isBlank()) {
            factsToSave.add(ExtractedFact.of(content, cat, score, "Manual Save"));
          }
        }
      } else {
        String singleContent =
            jsonNode.has("content")
                ? jsonNode.get("content").asText()
                : (jsonNode.has("fact") ? jsonNode.get("fact").asText() : null);
        if (singleContent != null && !singleContent.isBlank()) {
          FactCategory cat =
              parseCategory(jsonNode.has("category") ? jsonNode.get("category").asText() : null);
          float score =
              jsonNode.has("confidenceScore")
                  ? (float) jsonNode.get("confidenceScore").asDouble()
                  : 0.90f;
          factsToSave.add(ExtractedFact.of(singleContent, cat, score, "Manual Save"));
        }
      }

      if (factsToSave.isEmpty()) {
        return ToolExecutionResult.error("No valid fact content provided to save in memory.");
      }

      List<String> outcomes = new ArrayList<>();
      for (ExtractedFact fact : factsToSave) {
        var res = consolidationService.consolidate(workspaceId, userId, fact);
        outcomes.add(res.type() + ": " + fact.content());
      }

      return ToolExecutionResult.ok(
          "Đã lưu vào trí nhớ Memory Vault thành công: " + String.join("; ", outcomes));
    } catch (Exception e) {
      return ToolExecutionResult.error("Failed to execute save_memory tool: " + e.getMessage());
    }
  }

  private FactCategory parseCategory(String raw) {
    if (raw == null || raw.isBlank()) {
      return FactCategory.USER_PREFERENCE;
    }
    try {
      return FactCategory.valueOf(raw.trim().toUpperCase(java.util.Locale.ROOT));
    } catch (Exception e) {
      return FactCategory.USER_PREFERENCE;
    }
  }
}
