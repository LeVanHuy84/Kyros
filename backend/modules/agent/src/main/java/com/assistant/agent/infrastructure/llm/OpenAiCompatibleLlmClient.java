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
import java.util.TreeMap;
import java.util.function.Consumer;
import java.util.stream.Stream;
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
      List<Map<String, String>> chatHistory,
      List<AgentToolContract> availableTools) {
    return streamLlm(
        baseUrl, apiKey, modelName, systemPrompt, userPrompt, chatHistory, availableTools, null);
  }

  @Override
  public LlmResponse streamLlm(
      String baseUrl,
      String apiKey,
      String modelName,
      String systemPrompt,
      String userPrompt,
      List<Map<String, String>> chatHistory,
      List<AgentToolContract> availableTools,
      Consumer<String> tokenConsumer) {
    try {
      String effectiveBaseUrl =
          (baseUrl != null && !baseUrl.isBlank()) ? baseUrl : "https://api.groq.com/openai/v1";
      if (!effectiveBaseUrl.endsWith("/")) {
        effectiveBaseUrl += "/";
      }
      String targetUrl = effectiveBaseUrl + "chat/completions";

      boolean isLocalOllama =
          targetUrl.contains("11434")
              || targetUrl.contains("localhost")
              || targetUrl.contains("127.0.0.1");

      Map<String, Object> requestBody = new HashMap<>();
      requestBody.put(
          "model",
          (modelName != null && !modelName.isBlank()) ? modelName : "llama-3.3-70b-versatile");

      List<Map<String, Object>> messages = new ArrayList<>();
      String effectiveSystemPrompt = systemPrompt;

      if (availableTools != null && !availableTools.isEmpty()) {
        if (!isLocalOllama) {
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
        } else {
          StringBuilder toolDesc = new StringBuilder("\nAvailable tools:\n");
          for (AgentToolContract tool : availableTools) {
            toolDesc
                .append("- ")
                .append(tool.getName())
                .append(": ")
                .append(tool.getDescription())
                .append("\n");
          }
          effectiveSystemPrompt += toolDesc.toString();
        }
      }

      messages.add(Map.of("role", "system", "content", effectiveSystemPrompt));

      if (chatHistory != null && !chatHistory.isEmpty()) {
        for (Map<String, String> msg : chatHistory) {
          if (msg.containsKey("role") && msg.containsKey("content")) {
            String role = msg.get("role");
            if ("agent".equalsIgnoreCase(role) || "assistant".equalsIgnoreCase(role)) {
              role = "assistant";
            } else if (!"system".equalsIgnoreCase(role)) {
              role = "user";
            }
            messages.add(Map.of("role", role, "content", msg.get("content")));
          }
        }
      }

      boolean lastIsSameUserPrompt =
          chatHistory != null
              && !chatHistory.isEmpty()
              && userPrompt.equalsIgnoreCase(
                  chatHistory.get(chatHistory.size() - 1).get("content"));
      if (!lastIsSameUserPrompt) {
        messages.add(Map.of("role", "user", "content", userPrompt));
      }
      requestBody.put("messages", messages);

      boolean enableStreaming = (tokenConsumer != null);
      if (enableStreaming) {
        requestBody.put("stream", true);
      }

      String jsonPayload = objectMapper.writeValueAsString(requestBody);

      int timeoutSeconds = isLocalOllama ? 15 : 45;
      HttpRequest.Builder reqBuilder =
          HttpRequest.newBuilder()
              .uri(URI.create(targetUrl))
              .timeout(Duration.ofSeconds(timeoutSeconds))
              .header("Content-Type", "application/json")
              .POST(HttpRequest.BodyPublishers.ofString(jsonPayload));

      if (apiKey != null && !apiKey.isBlank()) {
        reqBuilder.header("Authorization", "Bearer " + apiKey);
      }

      if (!enableStreaming) {
        HttpResponse<String> response =
            httpClient.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofString());
        return parseNonStreamingResponse(response);
      }

      // Streaming execution with line-by-line SSE parsing
      HttpResponse<Stream<String>> streamResponse =
          httpClient.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofLines());

      if (streamResponse.statusCode() < 200 || streamResponse.statusCode() >= 300) {
        StringBuilder errBody = new StringBuilder();
        try (Stream<String> lines = streamResponse.body()) {
          lines.forEach(l -> errBody.append(l).append("\n"));
        }
        return new LlmResponse(
            "LLM Error (" + streamResponse.statusCode() + "): " + errBody.toString().trim(),
            Collections.emptyList());
      }

      StringBuilder fullContent = new StringBuilder();
      Map<Integer, PartialToolCall> toolCallsByIndex = new TreeMap<>();

      try (Stream<String> lines = streamResponse.body()) {
        lines.forEach(
            line -> {
              if (line == null || line.isBlank()) {
                return;
              }
              String trimmed = line.trim();
              if (trimmed.startsWith("data: ")) {
                String payload = trimmed.substring(6).trim();
                if ("[DONE]".equalsIgnoreCase(payload)) {
                  return;
                }
                try {
                  JsonNode root = objectMapper.readTree(payload);
                  JsonNode choices = root.path("choices");
                  if (choices.isArray() && !choices.isEmpty()) {
                    JsonNode choice = choices.get(0);
                    JsonNode delta = choice.path("delta");

                    // Handle text content chunk
                    if (delta.has("content") && !delta.path("content").isNull()) {
                      String chunk = delta.path("content").asText();
                      if (!chunk.isEmpty()) {
                        fullContent.append(chunk);
                        if (tokenConsumer != null) {
                          tokenConsumer.accept(chunk);
                        }
                      }
                    }

                    // Handle tool call stream chunks
                    if (delta.has("tool_calls") && delta.path("tool_calls").isArray()) {
                      for (JsonNode tcNode : delta.path("tool_calls")) {
                        int index = tcNode.path("index").asInt(0);
                        PartialToolCall ptc =
                            toolCallsByIndex.computeIfAbsent(index, k -> new PartialToolCall());

                        if (tcNode.has("function")) {
                          JsonNode fn = tcNode.path("function");
                          if (fn.has("name") && !fn.path("name").isNull()) {
                            ptc.name.append(fn.path("name").asText());
                          }
                          if (fn.has("arguments") && !fn.path("arguments").isNull()) {
                            ptc.arguments.append(fn.path("arguments").asText());
                          }
                        }
                      }
                    }
                  }
                } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                  // Skip unparseable non-JSON SSE chunks
                }
              }
            });
      }

      List<ToolCall> completedToolCalls = new ArrayList<>();
      for (PartialToolCall ptc : toolCallsByIndex.values()) {
        String toolName = ptc.name.toString().trim();
        String toolArgs = ptc.arguments.toString().trim();
        if (!toolName.isEmpty()) {
          completedToolCalls.add(new ToolCall(toolName, toolArgs.isEmpty() ? "{}" : toolArgs));
        }
      }

      return new LlmResponse(fullContent.toString(), completedToolCalls);
    } catch (Exception e) {
      return new LlmResponse("Invocation Error: " + e.getMessage(), Collections.emptyList());
    }
  }

  private LlmResponse parseNonStreamingResponse(HttpResponse<String> response) throws Exception {
    if (response.statusCode() >= 200 && response.statusCode() < 300) {
      JsonNode root = objectMapper.readTree(response.body());
      JsonNode choice = root.path("choices").get(0);
      JsonNode messageNode = choice.path("message");

      if (messageNode.has("tool_calls") && !messageNode.path("tool_calls").isEmpty()) {
        List<ToolCall> toolCalls = new ArrayList<>();
        for (JsonNode tcNode : messageNode.path("tool_calls")) {
          JsonNode fnNode = tcNode.path("function");
          String toolName = fnNode.path("name").asText();
          String toolArgs =
              fnNode.path("arguments").isObject()
                  ? objectMapper.writeValueAsString(fnNode.path("arguments"))
                  : fnNode.path("arguments").asText();
          toolCalls.add(new ToolCall(toolName, toolArgs));
        }
        return new LlmResponse(null, toolCalls);
      }

      String content = messageNode.path("content").asText("");
      return new LlmResponse(content, Collections.emptyList());
    } else {
      return new LlmResponse(
          "LLM Error (" + response.statusCode() + "): " + response.body(), Collections.emptyList());
    }
  }

  private static class PartialToolCall {
    final StringBuilder name = new StringBuilder();
    final StringBuilder arguments = new StringBuilder();
  }
}
