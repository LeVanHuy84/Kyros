package com.assistant.memory.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.assistant.memory.domain.model.ExtractedFact;
import com.assistant.memory.domain.model.FactCategory;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class FactExtractionServiceTest {

  private FactExtractionService factExtractionService;

  @BeforeEach
  void setUp() {
    factExtractionService = new FactExtractionService();
  }

  @Test
  void shouldExtractVietnameseWorkRule() {
    String text = "Lưu ý là tôi không bao giờ họp vào chiều thứ Sáu nhé.";
    List<ExtractedFact> facts = factExtractionService.extractFacts(text);

    assertFalse(facts.isEmpty());
    ExtractedFact fact = facts.get(0);
    assertEquals(FactCategory.WORK_RULE, fact.category());
    assertTrue(fact.content().toLowerCase(java.util.Locale.ROOT).contains("không bao giờ họp"));
    assertTrue(fact.confidenceScore() >= 0.85f);
  }

  @Test
  void shouldExtractEnglishWorkRule() {
    String text = "Please note: no meetings on Friday afternoon.";
    List<ExtractedFact> facts = factExtractionService.extractFacts(text);

    assertFalse(facts.isEmpty());
    ExtractedFact fact = facts.get(0);
    assertEquals(FactCategory.WORK_RULE, fact.category());
    assertTrue(fact.content().toLowerCase(java.util.Locale.ROOT).contains("no meetings on"));
  }

  @Test
  void shouldExtractUserPreference() {
    String text = "Thói quen của tôi là bắt đầu làm việc lúc 8h sáng và tôi thích họp qua Zoom.";
    List<ExtractedFact> facts = factExtractionService.extractFacts(text);

    assertFalse(facts.isEmpty());
    assertTrue(facts.stream().anyMatch(f -> f.category() == FactCategory.USER_PREFERENCE));
  }

  @Test
  void shouldExtractProjectContext() {
    String text =
        "Tôi đang làm dự án AI Executive Assistant với tech stack là Spring Boot và Angular.";
    List<ExtractedFact> facts = factExtractionService.extractFacts(text);

    assertFalse(facts.isEmpty());
    assertTrue(facts.stream().anyMatch(f -> f.category() == FactCategory.PROJECT_CONTEXT));
  }

  @Test
  void shouldExtractConstraintAndTimezone() {
    String text = "Múi giờ của tôi là Asia/Ho_Chi_Minh và tôi chỉ rảnh sau 16h.";
    List<ExtractedFact> facts = factExtractionService.extractFacts(text);

    assertFalse(facts.isEmpty());
    assertTrue(facts.stream().anyMatch(f -> f.category() == FactCategory.CONSTRAINT));
  }

  @Test
  void shouldIgnoreEphemeralChitChat() {
    List<ExtractedFact> factsHi = factExtractionService.extractFacts("Xin chào");
    assertTrue(factsHi.isEmpty());

    List<ExtractedFact> factsThanks = factExtractionService.extractFacts("Cảm ơn bạn nhiều");
    assertTrue(factsThanks.isEmpty());

    List<ExtractedFact> factsEmpty = factExtractionService.extractFacts("");
    assertTrue(factsEmpty.isEmpty());
  }
}
