package com.assistant.agent.infrastructure.llm;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SpringAiFactExtractorAdapterTest {

  private SpringAiFactExtractorAdapter adapter;

  @BeforeEach
  void setUp() {
    DynamicLlmClientFactory clientFactory = new DynamicLlmClientFactory();
    ObjectMapper objectMapper = new ObjectMapper();
    adapter = new SpringAiFactExtractorAdapter(clientFactory, objectMapper);
  }

  @Test
  void shouldReturnEmptyListForBlankOrNullInput() {
    assertTrue(adapter.extractFacts("").isEmpty());
    assertTrue(adapter.extractFacts("   ").isEmpty());
    assertTrue(adapter.extractFacts(null).isEmpty());
  }

  @Test
  void shouldGracefullyHandleInvocationFailureWithoutThrowing() {
    // When no actual LLM server is running or credentials are mock, it should gracefully return
    // empty
    List<?> facts = adapter.extractFacts("My work rule is never book meetings on Friday");
    assertNotNull(facts);
  }
}
