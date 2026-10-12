package com.assistant.agent.infrastructure.llm;

import com.assistant.memory.application.ports.out.LlmFactExtractorPort;
import com.assistant.memory.domain.model.ExtractedFact;
import com.assistant.memory.domain.model.FactCategory;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.stereotype.Component;

/**
 * Adapter implementing {@link LlmFactExtractorPort} using Spring AI {@link ChatClient} and {@link
 * BeanOutputConverter} for structured JSON fact extraction.
 */
@Component
public class SpringAiFactExtractorAdapter implements LlmFactExtractorPort {

  private static final Logger log = LoggerFactory.getLogger(SpringAiFactExtractorAdapter.class);

  public record FactDto(
      @JsonProperty("content") String content,
      @JsonProperty("category") String category,
      @JsonProperty("confidenceScore") float confidenceScore,
      @JsonProperty("keyTopic") String keyTopic) {}

  public record ExtractedFactListDto(@JsonProperty("facts") List<FactDto> facts) {}

  private final DynamicLlmClientFactory clientFactory;
  private final BeanOutputConverter<ExtractedFactListDto> outputConverter;

  public SpringAiFactExtractorAdapter(
      DynamicLlmClientFactory clientFactory, ObjectMapper objectMapper) {
    this.clientFactory = clientFactory;
    this.outputConverter = new BeanOutputConverter<>(ExtractedFactListDto.class, objectMapper);
  }

  @Override
  public List<ExtractedFact> extractFacts(String text) {
    if (text == null || text.isBlank()) {
      return List.of();
    }

    try {
      ChatClient chatClient = clientFactory.getOrCreateChatClient(null, null, null, null, null);
      String systemPrompt =
          "You are an AI fact and user preference extraction engine.\n"
              + "Analyze the following user statement and extract any long-term facts, work rules,"
              + " habits, project contexts, or constraints.\n"
              + "Categories allowed: WORK_RULE, USER_PREFERENCE, PROJECT_CONTEXT, CONSTRAINT,"
              + " GENERAL.\n"
              + "If no persistent facts are found, return an empty facts list.\n"
              + outputConverter.getFormat();

      String response = chatClient.prompt().system(systemPrompt).user(text).call().content();

      if (response == null || response.isBlank()) {
        return List.of();
      }

      ExtractedFactListDto result = outputConverter.convert(response);
      if (result == null || result.facts() == null) {
        return List.of();
      }

      List<ExtractedFact> facts = new ArrayList<>();
      for (FactDto dto : result.facts()) {
        if (dto.content() != null && !dto.content().isBlank()) {
          FactCategory category = parseCategory(dto.category());
          facts.add(
              ExtractedFact.of(
                  dto.content().trim(),
                  category,
                  dto.confidenceScore() > 0 ? dto.confidenceScore() : 0.9f,
                  dto.keyTopic() != null ? dto.keyTopic() : "General"));
        }
      }
      return facts;
    } catch (Exception e) {
      log.debug("Spring AI structured fact extraction unavailable or failed: {}", e.getMessage());
      return List.of();
    }
  }

  private FactCategory parseCategory(String categoryStr) {
    if (categoryStr == null) {
      return FactCategory.GENERAL;
    }
    try {
      return FactCategory.valueOf(categoryStr.trim().toUpperCase(Locale.ROOT));
    } catch (IllegalArgumentException e) {
      return FactCategory.GENERAL;
    }
  }
}
