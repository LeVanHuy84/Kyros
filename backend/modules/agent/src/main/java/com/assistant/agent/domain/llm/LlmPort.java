package com.assistant.agent.domain.llm;

import com.assistant.agent.domain.tool.AgentToolContract;
import java.util.List;

public interface LlmPort {

  record ToolCall(String name, String argumentsJson) {}

  record LlmResponse(String content, List<ToolCall> toolCalls) {}

  default LlmResponse callLlm(
      String baseUrl,
      String apiKey,
      String modelName,
      String systemPrompt,
      String userPrompt,
      List<AgentToolContract> availableTools) {
    return callLlm(
        baseUrl,
        apiKey,
        modelName,
        systemPrompt,
        userPrompt,
        java.util.Collections.emptyList(),
        availableTools);
  }

  LlmResponse callLlm(
      String baseUrl,
      String apiKey,
      String modelName,
      String systemPrompt,
      String userPrompt,
      List<java.util.Map<String, String>> chatHistory,
      List<AgentToolContract> availableTools);
}
