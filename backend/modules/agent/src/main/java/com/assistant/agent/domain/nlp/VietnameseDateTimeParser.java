package com.assistant.agent.domain.nlp;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Natural language parser for Vietnamese date, time, and scheduling expressions.
 * Maps phrases like "sáng mai 9h", "chiều thứ 6 tuần tới từ 14h đến 15h30",
 * "sau 3 ngày nữa lúc 10h", "tối nay 19h30" into accurate ZonedDateTime instances (Asia/Ho_Chi_Minh).
 */
public final class VietnameseDateTimeParser {

  public static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  public record ParseResult(
      ZonedDateTime startTime,
      ZonedDateTime endTime,
      String cleanedTitle,
      boolean hasExplicitTime,
      boolean hasExplicitDate) {}

  private static final Pattern TIME_RANGE_PATTERN =
      Pattern.compile(
          "(?i)(?:từ\\s*)?(\\d{1,2})(?:h|:| giờ)(\\d{1,2})?\\s*(?:đến|tới|-|->)\\s*(\\d{1,2})(?:h|:| giờ)(\\d{1,2})?");

  private static final Pattern SINGLE_TIME_PATTERN =
      Pattern.compile(
          "(?i)(?:lúc|vào lúc|vào|khoảng)?\\s*(\\d{1,2})(?:h|:| giờ)(\\d{1,2})?\\s*(sáng|trưa|chiều|tối)?");

  private static final Pattern DURATION_MINUTES_PATTERN =
      Pattern.compile("(?i)(?:trong|khoảng|kéo dài)?\\s*(\\d+)\\s*(?:phút|p)");

  private static final Pattern DURATION_HOURS_PATTERN =
      Pattern.compile("(?i)(?:trong|khoảng|kéo dài)?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:tiếng|giờ)");

  private static final Pattern DAYS_AHEAD_PATTERN =
      Pattern.compile("(?i)sau\\s*(\\d+)\\s*ngày(?:\\s*nữa)?");

  private static final Pattern SPECIFIC_DATE_PATTERN =
      Pattern.compile("(?i)(?:ngày\\s*)?(\\d{1,2})[/-](\\d{1,2})(?:[/-](\\d{4}))?");

  private VietnameseDateTimeParser() {}

  public static ParseResult parse(String input) {
    return parse(input, ZonedDateTime.now(VIETNAM_ZONE));
  }

  public static ParseResult parse(String input, ZonedDateTime baseTime) {
    if (input == null || input.isBlank()) {
      ZonedDateTime defaultStart = baseTime.plusHours(1);
      return new ParseResult(defaultStart, defaultStart.plusHours(1), "", false, false);
    }

    String text = input.trim();
    String lower = text.toLowerCase(Locale.ROOT);

    LocalDate targetDate = null;
    boolean hasExplicitDate = false;

    // 1. Date resolution
    Matcher daysAheadMatcher = DAYS_AHEAD_PATTERN.matcher(lower);
    if (daysAheadMatcher.find()) {
      int days = Integer.parseInt(daysAheadMatcher.group(1));
      targetDate = baseTime.toLocalDate().plusDays(days);
      hasExplicitDate = true;
    } else if (lower.contains("ngày kia") || lower.contains("mốt") || lower.contains("hôm kia")) {
      targetDate = baseTime.toLocalDate().plusDays(2);
      hasExplicitDate = true;
    } else if (lower.contains("ngày mai") || lower.contains("sáng mai") || lower.contains("chiều mai") || lower.contains("tối mai") || lower.contains("trưa mai") || lower.contains("mai")) {
      targetDate = baseTime.toLocalDate().plusDays(1);
      hasExplicitDate = true;
    } else if (lower.contains("hôm nay") || lower.contains("sáng nay") || lower.contains("chiều nay") || lower.contains("tối nay") || lower.contains("trưa nay") || lower.contains("nay")) {
      targetDate = baseTime.toLocalDate();
      hasExplicitDate = true;
    } else if (lower.contains("cuối tuần sau")) {
      targetDate = getNextDayOfWeek(baseTime.toLocalDate().plusWeeks(1), DayOfWeek.SATURDAY);
      hasExplicitDate = true;
    } else if (lower.contains("cuối tuần này") || lower.contains("cuối tuần")) {
      targetDate = getNextDayOfWeek(baseTime.toLocalDate(), DayOfWeek.SATURDAY);
      hasExplicitDate = true;
    } else {
      // Day of week resolution (thứ 2, thứ 3, ..., chủ nhật)
      DayOfWeek targetDow = extractDayOfWeek(lower);
      if (targetDow != null) {
        boolean nextWeek = lower.contains("tuần sau") || lower.contains("tuần tới");
        LocalDate refDate = nextWeek ? baseTime.toLocalDate().plusWeeks(1) : baseTime.toLocalDate();
        targetDate = getNextDayOfWeek(refDate, targetDow);
        hasExplicitDate = true;
      } else {
        // Specific date dd/MM or dd/MM/yyyy
        Matcher dateMatcher = SPECIFIC_DATE_PATTERN.matcher(lower);
        if (dateMatcher.find()) {
          int day = Integer.parseInt(dateMatcher.group(1));
          int month = Integer.parseInt(dateMatcher.group(2));
          int year = dateMatcher.group(3) != null ? Integer.parseInt(dateMatcher.group(3)) : baseTime.getYear();
          try {
            targetDate = LocalDate.of(year, month, day);
            hasExplicitDate = true;
          } catch (Exception ignored) {
          }
        }
      }
    }

    if (targetDate == null) {
      targetDate = baseTime.toLocalDate();
    }

    // 2. Time resolution
    LocalTime startTime = null;
    LocalTime endTime = null;
    boolean hasExplicitTime = false;

    // Check time range first (e.g. "từ 8h đến 10h", "14h - 15h30")
    Matcher rangeMatcher = TIME_RANGE_PATTERN.matcher(lower);
    if (rangeMatcher.find()) {
      int startHour = Integer.parseInt(rangeMatcher.group(1));
      int startMin = rangeMatcher.group(2) != null ? Integer.parseInt(rangeMatcher.group(2)) : 0;
      int endHour = Integer.parseInt(rangeMatcher.group(3));
      int endMin = rangeMatcher.group(4) != null ? Integer.parseInt(rangeMatcher.group(4)) : 0;

      // Adjust 12-hour ambiguity if "chiều" / "tối" mentioned
      if ((lower.contains("chiều") || lower.contains("tối")) && startHour < 12) {
        startHour += 12;
      }
      if ((lower.contains("chiều") || lower.contains("tối")) && endHour < 12) {
        endHour += 12;
      }

      startTime = LocalTime.of(Math.min(23, startHour), Math.min(59, startMin));
      endTime = LocalTime.of(Math.min(23, endHour), Math.min(59, endMin));
      hasExplicitTime = true;
    } else {
      // Single time pattern (e.g. "lúc 14h30", "9h sáng", "8h tối")
      Matcher singleMatcher = SINGLE_TIME_PATTERN.matcher(lower);
      if (singleMatcher.find()) {
        int hour = Integer.parseInt(singleMatcher.group(1));
        int min = singleMatcher.group(2) != null ? Integer.parseInt(singleMatcher.group(2)) : 0;
        String modifier = singleMatcher.group(3);

        if ("chiều".equals(modifier) && hour < 12) {
          hour += 12;
        } else if ("tối".equals(modifier) && hour < 12) {
          hour += 12;
        } else if (lower.contains("chiều") && hour < 12) {
          hour += 12;
        } else if (lower.contains("tối") && hour < 12) {
          hour += 12;
        }

        startTime = LocalTime.of(Math.min(23, hour), Math.min(59, min));
        hasExplicitTime = true;
      }
    }

    // Default time periods if no explicit hour was given
    if (startTime == null) {
      if (lower.contains("sáng")) {
        startTime = LocalTime.of(9, 0);
        hasExplicitTime = true;
      } else if (lower.contains("trưa")) {
        startTime = LocalTime.of(12, 0);
        hasExplicitTime = true;
      } else if (lower.contains("chiều")) {
        startTime = LocalTime.of(14, 0);
        hasExplicitTime = true;
      } else if (lower.contains("tối")) {
        startTime = LocalTime.of(19, 30);
        hasExplicitTime = true;
      } else {
        startTime = baseTime.toLocalTime().plusHours(1).withMinute(0).withSecond(0).withNano(0);
      }
    }

    // 3. Duration resolution
    if (endTime == null) {
      if (lower.contains("tiếng rưỡi") || lower.contains("giờ rưỡi")) {
        Matcher hrHalfMatcher = Pattern.compile("(?i)(\\d+)\\s*(?:tiếng|giờ)\\s*rưỡi").matcher(lower);
        if (hrHalfMatcher.find()) {
          int hrs = Integer.parseInt(hrHalfMatcher.group(1));
          endTime = startTime.plusMinutes(hrs * 60L + 30);
        } else {
          endTime = startTime.plusMinutes(90);
        }
      } else {
        Matcher minMatcher = DURATION_MINUTES_PATTERN.matcher(lower);
        if (minMatcher.find()) {
          int durationMinutes = Integer.parseInt(minMatcher.group(1));
          endTime = startTime.plusMinutes(durationMinutes);
        } else {
          Matcher hrMatcher = DURATION_HOURS_PATTERN.matcher(lower);
          if (hrMatcher.find()) {
            double hours = Double.parseDouble(hrMatcher.group(1));
            endTime = startTime.plusMinutes((long) (hours * 60));
          } else {
            endTime = startTime.plusHours(1);
          }
        }
      }
    }

    ZonedDateTime finalStart = ZonedDateTime.of(targetDate, startTime, VIETNAM_ZONE);
    ZonedDateTime finalEnd = ZonedDateTime.of(targetDate, endTime, VIETNAM_ZONE);
    if (!finalEnd.isAfter(finalStart)) {
      finalEnd = finalStart.plusHours(1);
    }

    // 4. Clean title
    String cleaned = cleanTitle(text);

    return new ParseResult(finalStart, finalEnd, cleaned, hasExplicitTime, hasExplicitDate);
  }

  private static DayOfWeek extractDayOfWeek(String lower) {
    if (lower.contains("chủ nhật") || lower.contains("cn")) {
      return DayOfWeek.SUNDAY;
    }
    if (lower.contains("thứ 2") || lower.contains("thứ hai")) {
      return DayOfWeek.MONDAY;
    }
    if (lower.contains("thứ 3") || lower.contains("thứ ba")) {
      return DayOfWeek.TUESDAY;
    }
    if (lower.contains("thứ 4") || lower.contains("thứ tư") || lower.contains("thứ bốn")) {
      return DayOfWeek.WEDNESDAY;
    }
    if (lower.contains("thứ 5") || lower.contains("thứ năm")) {
      return DayOfWeek.THURSDAY;
    }
    if (lower.contains("thứ 6") || lower.contains("thứ sáu")) {
      return DayOfWeek.FRIDAY;
    }
    if (lower.contains("thứ 7") || lower.contains("thứ bảy")) {
      return DayOfWeek.SATURDAY;
    }
    return null;
  }

  private static LocalDate getNextDayOfWeek(LocalDate fromDate, DayOfWeek targetDow) {
    int currentDow = fromDate.getDayOfWeek().getValue();
    int targetVal = targetDow.getValue();
    int daysToAdd = (targetVal - currentDow + 7) % 7;
    if (daysToAdd == 0) {
      daysToAdd = 7;
    }
    return fromDate.plusDays(daysToAdd);
  }

  private static String cleanTitle(String input) {
    String cleaned = input
        .replaceAll("(?i)^(lên lịch|đặt lịch|tạo lịch|nhắc tôi|tạo task|thêm task|tạo việc|giúp tôi|hãy)\\s*", "")
        .replaceAll("(?i)(vào lúc|lúc|từ|đến|tới)\\s*\\d{1,2}(?:h|:| giờ)\\d{0,2}", "")
        .replaceAll("(?i)(sáng mai|chiều mai|tối mai|trưa mai|ngày mai|hôm nay|sáng nay|chiều nay|tối nay|trưa nay|ngày kia|sau \\d+ ngày nữa)", "")
        .replaceAll("(?i)(thứ \\d+|thứ hai|thứ ba|thứ tư|thứ bốn|thứ năm|thứ sáu|thứ bảy|chủ nhật)(?: tuần sau| tuần tới| này)?", "")
        .replaceAll("(?i)(trong \\d+ (?:phút|tiếng|giờ)|\\d+p|\\d+ phút)", "")
        .replaceAll("\\s+", " ")
        .trim();
    return cleaned.isEmpty() ? input : cleaned;
  }
}
