package com.assistant.memory.domain.model;

/** Record representing a structured fact extracted from user conversation turns. */
public record ExtractedFact(
    String content, FactCategory category, float confidenceScore, String keyTopic) {
  public ExtractedFact {
    if (content == null || content.trim().isEmpty()) {
      throw new IllegalArgumentException("Fact content cannot be blank");
    }
    if (category == null) {
      category = FactCategory.GENERAL;
    }
    if (confidenceScore < 0.0f || confidenceScore > 1.0f) {
      confidenceScore = 0.85f;
    }
  }

  public static ExtractedFact of(
      String content, FactCategory category, float confidenceScore, String keyTopic) {
    return new ExtractedFact(content, category, confidenceScore, keyTopic);
  }
}
