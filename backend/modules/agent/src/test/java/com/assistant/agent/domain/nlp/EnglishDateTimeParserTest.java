package com.assistant.agent.domain.nlp;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import org.junit.jupiter.api.Test;

class EnglishDateTimeParserTest {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  @Test
  void testTomorrowMorningParsing() {
    ZonedDateTime base = ZonedDateTime.of(2026, 9, 25, 10, 0, 0, 0, ZONE);
    var result = EnglishDateTimeParser.parse("Schedule team sync tomorrow morning", base);

    assertTrue(result.hasExplicitDate());
    assertTrue(result.hasExplicitTime());
    assertEquals(2026, result.startTime().getYear());
    assertEquals(9, result.startTime().getMonthValue());
    assertEquals(26, result.startTime().getDayOfMonth());
    assertEquals(9, result.startTime().getHour());
    assertEquals("team sync", result.cleanedTitle());
  }

  @Test
  void testTimeRangeParsing() {
    ZonedDateTime base = ZonedDateTime.of(2026, 9, 25, 10, 0, 0, 0, ZONE);
    var result =
        EnglishDateTimeParser.parse("Meeting with Client tomorrow from 2pm to 3:30pm", base);

    assertTrue(result.hasExplicitDate());
    assertTrue(result.hasExplicitTime());
    assertEquals(14, result.startTime().getHour());
    assertEquals(0, result.startTime().getMinute());
    assertEquals(15, result.endTime().getHour());
    assertEquals(30, result.endTime().getMinute());
  }

  @Test
  void testCompositeNaturalParserWithVietnameseAndEnglish() {
    ZonedDateTime base = ZonedDateTime.of(2026, 9, 25, 10, 0, 0, 0, ZONE);

    // Vietnamese
    var viResult = NaturalDateTimeParser.parse("Họp dự án sáng mai 9h", base);
    assertTrue(viResult.hasExplicitDate());
    assertEquals(26, viResult.startTime().getDayOfMonth());
    assertEquals(9, viResult.startTime().getHour());

    // English
    var enResult = NaturalDateTimeParser.parse("Project meeting tomorrow at 9am", base);
    assertTrue(enResult.hasExplicitDate());
    assertEquals(26, enResult.startTime().getDayOfMonth());
    assertEquals(9, enResult.startTime().getHour());
  }
}
