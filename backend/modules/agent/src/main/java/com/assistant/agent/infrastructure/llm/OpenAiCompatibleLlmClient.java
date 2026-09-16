package com.assistant.agent.infrastructure.llm;

import com.assistant.agent.domain.llm.LlmPort;
import com.assistant.agent.domain.tool.AgentToolContract;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class OpenAiCompatibleLlmClient implements LlmPort {

  private final HttpClient httpClient;
  private final ObjectMapper objectMapper;

  public OpenAiCompatibleLlmClient(ObjectMapper objectMapper) {
    this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    this.objectMapper = objectMapper;
  }

  @Override
  public LlmResponse callLlm(
      String baseUrl,
      String apiKey,
      String modelName,
      String systemPrompt,
      String userPrompt,
      List<AgentToolContract> availableTools) {
    try {
      String effectiveBaseUrl = (baseUrl != null && !baseUrl.isBlank()) ? baseUrl : "https://api.groq.com/openai/v1";
      if (!effectiveBaseUrl.endsWith("/")) {
        effectiveBaseUrl += "/";
      }
      String targetUrl = effectiveBaseUrl + "chat/completions";

      Map<String, Object> requestBody = new HashMap<>();
      requestBody.put("model", (modelName != null && !modelName.isBlank()) ? modelName : "llama-3.3-70b-versatile");

      List<Map<String, Object>> messages = new ArrayList<>();
      messages.add(Map.of("role", "system", "content", systemPrompt));
      messages.add(Map.of("role", "user", "content", userPrompt));
      requestBody.put("messages", messages);

      // Small local LLMs (like qwen2.5:1.5b) might fail or crash if unexpected/empty tool schemas are sent.
      // Only include tools if availableTools is non-null and not empty.
      if (availableTools != null && !availableTools.isEmpty()) {
        List<Map<String, Object>> toolsJson = new ArrayList<>();
        for (AgentToolContract tool : availableTools) {
          Map<String, Object> functionDef = new HashMap<>();
          functionDef.put("name", tool.getName());
          functionDef.put("description", tool.getDescription());
          try {
            functionDef.put("parameters", objectMapper.readTree(tool.getJsonSchema()));
          } catch (Exception e) {
            functionDef.put("parameters", Map.of("type", "object"));
          }
          toolsJson.add(Map.of("type", "function", "function", functionDef));
        }
        requestBody.put("tools", toolsJson);
      }

      String jsonPayload = objectMapper.writeValueAsString(requestBody);

      HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
          .uri(URI.create(targetUrl))
          .timeout(Duration.ofSeconds(45))
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(jsonPayload));

      if (apiKey != null && !apiKey.isBlank()) {
        reqBuilder.header("Authorization", "Bearer " + apiKey);
      }

      HttpResponse<String> response = httpClient.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());

      if (response.statusCode() >= 200 && response.statusCode() < 300) {
        JsonNode root = objectMapper.readTree(response.body());
        JsonNode choice = root.path("choices").get(0);
        JsonNode messageNode = choice.path("message");

        if (messageNode.has("tool_calls") && !messageNode.path("tool_calls").isEmpty()) {
          List<ToolCall> toolCalls = new ArrayList<>();
          for (JsonNode tcNode : messageNode.path("tool_calls")) {
            JsonNode fnNode = tcNode.path("function");
            String toolName = fnNode.path("name").asText();
            String toolArgs = fnNode.path("arguments").isObject()
                ? objectMapper.writeValueAsString(fnNode.path("arguments"))
                : fnNode.path("arguments").asText();
            toolCalls.add(new ToolCall(toolName, toolArgs));
          }
          return new LlmResponse(null, toolCalls);
        }

        String content = messageNode.path("content").asText("");
        return new LlmResponse(content, Collections.emptyList());
      } else {
        return new LlmResponse("LLM Error (" + response.statusCode() + "): " + response.body(), Collections.emptyList());
      }
    } catch (Exception e) {
      return new LlmResponse("Invocation Error: " + e.getMessage(), Collections.emptyList());
    }
  }
}
