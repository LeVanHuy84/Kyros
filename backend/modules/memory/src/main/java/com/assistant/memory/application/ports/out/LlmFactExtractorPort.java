package com.assistant.memory.application.ports.out;

import com.assistant.memory.domain.model.ExtractedFact;
import java.util.List;

/**
 * Output port for LLM-powered structured fact and preference extraction. Enables zero-dependency
 * hexagonal decoupling for memory extraction.
 */
public interface LlmFactExtractorPort {

  /**
   * Extracts structured facts, habits, rules, and preferences from text using an LLM.
   *
   * @param text conversation turn or content text
   * @return list of extracted facts, or empty list if none detected or extraction fails
   */
  List<ExtractedFact> extractFacts(String text);
}
