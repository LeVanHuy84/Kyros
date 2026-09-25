package com.assistant.agent.domain.nlp;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Natural language parser for English date, time, and scheduling expressions. Maps phrases like
 * "tomorrow at 9am", "next Friday from 2pm to 3:30pm", "in 3 days at 10:00", "tonight at 7:30pm"
 * into accurate ZonedDateTime instances.
 */
public final class EnglishDateTimeParser {

  public static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private static final Pattern TIME_RANGE_PATTERN =
      Pattern.compile(
          "(?i)(?:from\\s*)?(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?\\s*(?:to|-|until|->)\\s*(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?");

  private static final Pattern SINGLE_TIME_PATTERN =
      Pattern.compile("(?i)(?:at|around|about)?\\s*(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?");

  private static final Pattern DURATION_MINUTES_PATTERN =
      Pattern.compile("(?i)(?:for|in)?\\s*(\\d+)\\s*(?:minutes|mins|min|m)");

  private static final Pattern DURATION_HOURS_PATTERN =
      Pattern.compile("(?i)(?:for|in)?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:hours|hour|hrs|hr|h)");

  private static final Pattern DAYS_AHEAD_PATTERN =
      Pattern.compile("(?i)(?:in|after)\\s*(\\d+)\\s*days?");

  private static final Pattern SPECIFIC_DATE_PATTERN =
      Pattern.compile(
          "(?i)(?:on\\s*)?(\\d{4})[/-](\\d{1,2})[/-](\\d{1,2})|(\\d{1,2})[/-](\\d{1,2})(?:[/-](\\d{4}))?");

  private EnglishDateTimeParser() {}

  public static VietnameseDateTimeParser.ParseResult parse(String input) {
    return parse(input, ZonedDateTime.now(DEFAULT_ZONE));
  }

  public static VietnameseDateTimeParser.ParseResult parse(String input, ZonedDateTime baseTime) {
    if (input == null || input.isBlank()) {
      ZonedDateTime defaultStart = baseTime.plusHours(1);
      return new VietnameseDateTimeParser.ParseResult(
          defaultStart, defaultStart.plusHours(1), "", false, false);
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
    } else if (lower.contains("day after tomorrow")) {
      targetDate = baseTime.toLocalDate().plusDays(2);
      hasExplicitDate = true;
    } else if (lower.contains("tomorrow morning")
        || lower.contains("tomorrow afternoon")
        || lower.contains("tomorrow evening")
        || lower.contains("tomorrow night")
        || lower.contains("tomorrow")) {
      targetDate = baseTime.toLocalDate().plusDays(1);
      hasExplicitDate = true;
    } else if (lower.contains("this morning")
        || lower.contains("this afternoon")
        || lower.contains("this evening")
        || lower.contains("tonight")
        || lower.contains("today")) {
      targetDate = baseTime.toLocalDate();
      hasExplicitDate = true;
    } else if (lower.contains("next weekend")) {
      targetDate = getNextDayOfWeek(baseTime.toLocalDate().plusWeeks(1), DayOfWeek.SATURDAY);
      hasExplicitDate = true;
    } else if (lower.contains("this weekend") || lower.contains("weekend")) {
      targetDate = getNextDayOfWeek(baseTime.toLocalDate(), DayOfWeek.SATURDAY);
      hasExplicitDate = true;
    } else {
      DayOfWeek targetDow = extractDayOfWeek(lower);
      if (targetDow != null) {
        boolean nextWeek = lower.contains("next ");
        LocalDate refDate = nextWeek ? baseTime.toLocalDate().plusWeeks(1) : baseTime.toLocalDate();
        targetDate = getNextDayOfWeek(refDate, targetDow);
        hasExplicitDate = true;
      } else {
        Matcher dateMatcher = SPECIFIC_DATE_PATTERN.matcher(lower);
        if (dateMatcher.find()) {
          try {
            if (dateMatcher.group(1) != null) {
              int year = Integer.parseInt(dateMatcher.group(1));
              int month = Integer.parseInt(dateMatcher.group(2));
              int day = Integer.parseInt(dateMatcher.group(3));
              targetDate = LocalDate.of(year, month, day);
              hasExplicitDate = true;
            } else if (dateMatcher.group(4) != null) {
              int day = Integer.parseInt(dateMatcher.group(4));
              int month = Integer.parseInt(dateMatcher.group(5));
              int year =
                  dateMatcher.group(6) != null
                      ? Integer.parseInt(dateMatcher.group(6))
                      : baseTime.getYear();
              targetDate = LocalDate.of(year, month, day);
              hasExplicitDate = true;
            }
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

    Matcher rangeMatcher = TIME_RANGE_PATTERN.matcher(lower);
    if (rangeMatcher.find()) {
      int startHour = Integer.parseInt(rangeMatcher.group(1));
      int startMin = rangeMatcher.group(2) != null ? Integer.parseInt(rangeMatcher.group(2)) : 0;
      String startAmPm = rangeMatcher.group(3);

      int endHour = Integer.parseInt(rangeMatcher.group(4));
      int endMin = rangeMatcher.group(5) != null ? Integer.parseInt(rangeMatcher.group(5)) : 0;
      String endAmPm = rangeMatcher.group(6);

      if ("pm".equalsIgnoreCase(startAmPm) && startHour < 12) {
        startHour += 12;
      } else if ("am".equalsIgnoreCase(startAmPm) && startHour == 12) {
        startHour = 0;
      }

      if ("pm".equalsIgnoreCase(endAmPm) && endHour < 12) {
        endHour += 12;
      } else if ("am".equalsIgnoreCase(endAmPm) && endHour == 12) {
        endHour = 0;
      }

      startTime = LocalTime.of(Math.min(23, startHour), Math.min(59, startMin));
      endTime = LocalTime.of(Math.min(23, endHour), Math.min(59, endMin));
      hasExplicitTime = true;
    } else {
      Matcher singleMatcher = SINGLE_TIME_PATTERN.matcher(lower);
      if (singleMatcher.find()) {
        int hour = Integer.parseInt(singleMatcher.group(1));
        int min = singleMatcher.group(2) != null ? Integer.parseInt(singleMatcher.group(2)) : 0;
        String ampm = singleMatcher.group(3);

        if ("pm".equalsIgnoreCase(ampm) && hour < 12) {
          hour += 12;
        } else if ("am".equalsIgnoreCase(ampm) && hour == 12) {
          hour = 0;
        } else if (ampm == null) {
          if ((lower.contains("afternoon")
                  || lower.contains("evening")
                  || lower.contains("tonight")
                  || lower.contains("night"))
              && hour < 12) {
            hour += 12;
          }
        }

        startTime = LocalTime.of(Math.min(23, hour), Math.min(59, min));
        hasExplicitTime = true;
      }
    }

    if (startTime == null) {
      if (lower.contains("morning")) {
        startTime = LocalTime.of(9, 0);
        hasExplicitTime = true;
      } else if (lower.contains("noon") || lower.contains("lunch")) {
        startTime = LocalTime.of(12, 0);
        hasExplicitTime = true;
      } else if (lower.contains("afternoon")) {
        startTime = LocalTime.of(14, 0);
        hasExplicitTime = true;
      } else if (lower.contains("evening")
          || lower.contains("tonight")
          || lower.contains("night")) {
        startTime = LocalTime.of(19, 30);
        hasExplicitTime = true;
      } else {
        startTime = baseTime.toLocalTime().plusHours(1).withMinute(0).withSecond(0).withNano(0);
      }
    }

    // 3. Duration resolution
    if (endTime == null) {
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

    ZonedDateTime finalStart = ZonedDateTime.of(targetDate, startTime, DEFAULT_ZONE);
    ZonedDateTime finalEnd = ZonedDateTime.of(targetDate, endTime, DEFAULT_ZONE);
    if (!finalEnd.isAfter(finalStart)) {
      finalEnd = finalStart.plusHours(1);
    }

    String cleaned = cleanTitle(text);
    return new VietnameseDateTimeParser.ParseResult(
        finalStart, finalEnd, cleaned, hasExplicitTime, hasExplicitDate);
  }

  private static DayOfWeek extractDayOfWeek(String lower) {
    if (lower.contains("sunday") || lower.contains("sun")) {
      return DayOfWeek.SUNDAY;
    }
    if (lower.contains("monday") || lower.contains("mon")) {
      return DayOfWeek.MONDAY;
    }
    if (lower.contains("tuesday") || lower.contains("tue")) {
      return DayOfWeek.TUESDAY;
    }
    if (lower.contains("wednesday") || lower.contains("wed")) {
      return DayOfWeek.WEDNESDAY;
    }
    if (lower.contains("thursday") || lower.contains("thu")) {
      return DayOfWeek.THURSDAY;
    }
    if (lower.contains("friday") || lower.contains("fri")) {
      return DayOfWeek.FRIDAY;
    }
    if (lower.contains("saturday") || lower.contains("sat")) {
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
    String cleaned =
        input
            .replaceAll(
                "(?i)^(schedule|plan|book|remind me to|create task|add task|create|add|please|help"
                    + " me)\\s*",
                "")
            .replaceAll("(?i)(at|from|to|until)\\s*\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?", "")
            .replaceAll(
                "(?i)(tomorrow morning|tomorrow afternoon|tomorrow evening|tomorrow"
                    + " night|tomorrow|this morning|this afternoon|this evening|tonight|today|in"
                    + " \\d+ days?)",
                "")
            .replaceAll(
                "(?i)(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\\s*next"
                    + " week|\\s*this week)?",
                "")
            .replaceAll("(?i)(for \\d+ (?:minutes|mins|min|m|hours|hour|hrs|hr|h))", "")
            .replaceAll("\\s+", " ")
            .trim();
    return cleaned.isEmpty() ? input : cleaned;
  }
}
