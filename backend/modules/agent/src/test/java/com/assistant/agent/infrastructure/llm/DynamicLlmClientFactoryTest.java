package com.assistant.agent.infrastructure.llm;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.client.ChatClient;

class DynamicLlmClientFactoryTest {

  private DynamicLlmClientFactory factory;

  @BeforeEach
  void setUp() {
    factory = new DynamicLlmClientFactory();
  }

  @Test
  void shouldCreateChatClientWithValidConfig() {
    UUID wsId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();

    ChatClient client =
        factory.getOrCreateChatClient(
            wsId, userId, "https://api.openai.com/v1", "sk-test-key-12345", "gpt-4o-mini");

    assertNotNull(client);
  }

  @Test
  void shouldCacheAndReuseChatClientForSameKeyAndUser() {
    UUID wsId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();

    ChatClient client1 =
        factory.getOrCreateChatClient(
            wsId,
            userId,
            "https://api.groq.com/openai/v1",
            "gsk-mock-key-abc",
            "llama-3.3-70b-versatile");

    ChatClient client2 =
        factory.getOrCreateChatClient(
            wsId,
            userId,
            "https://api.groq.com/openai/v1",
            "gsk-mock-key-abc",
            "llama-3.3-70b-versatile");

    assertSame(
        client1, client2, "Clients with identical config should be served from Caffeine cache");
  }

  @Test
  void shouldFallbackToDefaultsWhenParametersAreBlank() {
    ChatClient client = factory.getOrCreateChatClient(null, null, null, null, null);
    assertNotNull(client);
  }
}
