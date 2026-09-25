package com.assistant.agent.domain.llm;

import com.assistant.agent.domain.tool.AgentToolContract;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

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
      List<Map<String, String>> chatHistory,
      List<AgentToolContract> availableTools);

  default LlmResponse streamLlm(
      String baseUrl,
      String apiKey,
      String modelName,
      String systemPrompt,
      String userPrompt,
      List<Map<String, String>> chatHistory,
      List<AgentToolContract> availableTools,
      Consumer<String> tokenConsumer) {
    LlmResponse response =
        callLlm(baseUrl, apiKey, modelName, systemPrompt, userPrompt, chatHistory, availableTools);
    if (tokenConsumer != null && response.content() != null && !response.content().isBlank()) {
      tokenConsumer.accept(response.content());
    }
    return response;
  }
}
