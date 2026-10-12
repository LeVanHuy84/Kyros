package com.assistant.agent.infrastructure.llm;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.stereotype.Component;

/**
 * Factory that dynamically instantiates Spring AI {@link ChatClient} instances scoped to each
 * user's BYOK (Bring Your Own Key) configuration (Groq, OpenAI, OpenRouter, Ollama). Reuses
 * underlying HTTP connection pools across user turns via a Caffeine LRU cache.
 */
@Component
public class DynamicLlmClientFactory {

  private static final Logger log = LoggerFactory.getLogger(DynamicLlmClientFactory.class);
  private static final String DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
  private static final String DEFAULT_MODEL = "llama-3.3-70b-versatile";

  private final Cache<String, ChatClient> clientCache;

  public DynamicLlmClientFactory() {
    this.clientCache =
        Caffeine.newBuilder().expireAfterAccess(Duration.ofMinutes(15)).maximumSize(500).build();
  }

  /** Retrieves or builds a cached ChatClient configured with the user's provider credentials. */
  public ChatClient getOrCreateChatClient(
      @Nullable UUID workspaceId,
      @Nullable UUID userId,
      @Nullable String baseUrl,
      @Nullable String apiKey,
      @Nullable String model) {

    String rawBaseUrl = (baseUrl != null && !baseUrl.isBlank()) ? baseUrl.trim() : DEFAULT_BASE_URL;
    final String finalBaseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl : rawBaseUrl + "/";
    final String finalModel = (model != null && !model.isBlank()) ? model.trim() : DEFAULT_MODEL;
    final String finalApiKey = (apiKey != null) ? apiKey.trim() : "";

    String keyHash = hashKey(finalApiKey);
    String cacheKey =
        String.format(
            "%s:%s:%s:%s",
            workspaceId != null ? workspaceId : "global",
            userId != null ? userId : "anonymous",
            finalBaseUrl,
            keyHash);

    return clientCache.get(
        cacheKey,
        k -> {
          log.info(
              "Creating new Spring AI ChatClient for workspace={} model={} baseUrl={}",
              workspaceId,
              finalModel,
              finalBaseUrl);

          OpenAiApi openAiApi =
              OpenAiApi.builder().baseUrl(finalBaseUrl).apiKey(finalApiKey).build();

          OpenAiChatModel chatModel =
              OpenAiChatModel.builder()
                  .openAiApi(openAiApi)
                  .defaultOptions(
                      OpenAiChatOptions.builder().model(finalModel).temperature(0.3).build())
                  .build();

          return ChatClient.builder(chatModel).build();
        });
  }

  private String hashKey(String apiKey) {
    if (apiKey.isEmpty()) {
      return "none";
    }
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] digest = md.digest(apiKey.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest).substring(0, 16);
    } catch (NoSuchAlgorithmException e) {
      return String.valueOf(apiKey.hashCode());
    }
  }
}
