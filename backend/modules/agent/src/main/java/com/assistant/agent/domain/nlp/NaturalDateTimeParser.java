package com.assistant.agent.domain.nlp;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Locale;

/**
 * Unified Natural Language DateTime Parser supporting both Vietnamese and English scheduling
 * expressions.
 */
public final class NaturalDateTimeParser {

  public static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private NaturalDateTimeParser() {}

  public static VietnameseDateTimeParser.ParseResult parse(String input) {
    return parse(input, ZonedDateTime.now(DEFAULT_ZONE));
  }

  public static VietnameseDateTimeParser.ParseResult parse(String input, ZonedDateTime baseTime) {
    if (input == null || input.isBlank()) {
      ZonedDateTime defaultStart = baseTime.plusHours(1);
      return new VietnameseDateTimeParser.ParseResult(
          defaultStart, defaultStart.plusHours(1), "", false, false);
    }

    String lower = input.toLowerCase(Locale.ROOT);

    boolean hasVietnameseIndicators =
        lower.contains("mai")
            || lower.contains("nay")
            || lower.contains("hôm")
            || lower.contains("sáng")
            || lower.contains("trưa")
            || lower.contains("chiều")
            || lower.contains("tối")
            || lower.contains("thứ ")
            || lower.contains("tuần")
            || lower.contains("giờ")
            || lower.contains("tiếng")
            || lower.contains("phút")
            || lower.contains("lúc")
            || lower.contains("ngày");

    if (hasVietnameseIndicators) {
      var viResult = VietnameseDateTimeParser.parse(input, baseTime);
      if (viResult.hasExplicitDate() || viResult.hasExplicitTime()) {
        return viResult;
      }
    }

    var enResult = EnglishDateTimeParser.parse(input, baseTime);
    if (enResult.hasExplicitDate() || enResult.hasExplicitTime()) {
      return enResult;
    }

    // Default fallback to Vietnamese parser
    return VietnameseDateTimeParser.parse(input, baseTime);
  }
}
