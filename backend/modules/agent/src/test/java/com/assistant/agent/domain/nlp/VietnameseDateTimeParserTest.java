package com.assistant.agent.domain.nlp;

import static org.junit.jupiter.api.Assertions.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class VietnameseDateTimeParserTest {

  private ZonedDateTime fixedNow;

  @BeforeEach
  void setUp() {
    // Reference date: Thursday, 2026-09-24 10:00:00 GMT+7
    fixedNow =
        ZonedDateTime.of(
            LocalDate.of(2026, 9, 24),
            LocalTime.of(10, 0, 0),
            VietnameseDateTimeParser.VIETNAM_ZONE);
  }

  @Test
  @DisplayName("Parse 'chiều mai 14h họp team'")
  void testChieuMai() {
    var res = VietnameseDateTimeParser.parse("chiều mai 14h họp team", fixedNow);
    assertEquals(LocalDate.of(2026, 9, 25), res.startTime().toLocalDate());
    assertEquals(14, res.startTime().getHour());
    assertEquals(0, res.startTime().getMinute());
    assertEquals(15, res.endTime().getHour());
    assertTrue(res.cleanedTitle().contains("họp team"));
  }

  @Test
  @DisplayName("Parse 'sáng mai lúc 9h30'")
  void testSangMai() {
    var res = VietnameseDateTimeParser.parse("sáng mai lúc 9h30", fixedNow);
    assertEquals(LocalDate.of(2026, 9, 25), res.startTime().toLocalDate());
    assertEquals(9, res.startTime().getHour());
    assertEquals(30, res.startTime().getMinute());
  }

  @Test
  @DisplayName("Parse time range: 'từ 8h đến 10h sáng nay'")
  void testRange() {
    var res = VietnameseDateTimeParser.parse("từ 8h đến 10h sáng nay", fixedNow);
    assertEquals(LocalDate.of(2026, 9, 24), res.startTime().toLocalDate());
    assertEquals(8, res.startTime().getHour());
    assertEquals(10, res.endTime().getHour());
  }

  @Test
  @DisplayName("Parse afternoon range: 'từ 14h đến 15h30'")
  void testAfternoonRange() {
    var res = VietnameseDateTimeParser.parse("từ 14h đến 15h30 chiều nay", fixedNow);
    assertEquals(LocalDate.of(2026, 9, 24), res.startTime().toLocalDate());
    assertEquals(14, res.startTime().getHour());
    assertEquals(0, res.startTime().getMinute());
    assertEquals(15, res.endTime().getHour());
    assertEquals(30, res.endTime().getMinute());
  }

  @Test
  @DisplayName("Parse 'thứ 6 tuần tới lúc 9h sáng'")
  void testNextWeekFriday() {
    var res = VietnameseDateTimeParser.parse("thứ 6 tuần tới lúc 9h sáng", fixedNow);
    assertEquals(DayOfWeek.FRIDAY, res.startTime().getDayOfWeek());
    assertEquals(9, res.startTime().getHour());
  }

  @Test
  @DisplayName("Parse 'sau 3 ngày nữa lúc 10h'")
  void testDaysAhead() {
    var res = VietnameseDateTimeParser.parse("sau 3 ngày nữa lúc 10h", fixedNow);
    assertEquals(LocalDate.of(2026, 9, 27), res.startTime().toLocalDate());
    assertEquals(10, res.startTime().getHour());
  }

  @Test
  @DisplayName("Parse duration: 'họp lúc 15h trong 45 phút'")
  void testDuration() {
    var res = VietnameseDateTimeParser.parse("họp lúc 15h trong 45 phút", fixedNow);
    assertEquals(15, res.startTime().getHour());
    assertEquals(0, res.startTime().getMinute());
    assertEquals(15, res.endTime().getHour());
    assertEquals(45, res.endTime().getMinute());
  }

  @Test
  @DisplayName("Parse 'tối mai 19h30 ăn tối'")
  void testEvening() {
    var res = VietnameseDateTimeParser.parse("tối mai 19h30 ăn tối", fixedNow);
    assertEquals(LocalDate.of(2026, 9, 25), res.startTime().toLocalDate());
    assertEquals(19, res.startTime().getHour());
    assertEquals(30, res.startTime().getMinute());
    assertEquals(20, res.endTime().getHour());
    assertEquals(30, res.endTime().getMinute());
  }

  @Test
  @DisplayName("Parse 'cuối tuần này'")
  void testThisWeekend() {
    var res = VietnameseDateTimeParser.parse("cuối tuần này đi chơi", fixedNow);
    assertEquals(DayOfWeek.SATURDAY, res.startTime().getDayOfWeek());
    assertEquals(LocalDate.of(2026, 9, 26), res.startTime().toLocalDate());
  }

  @Test
  @DisplayName("Parse 'chủ nhật tuần sau'")
  void testNextSunday() {
    var res = VietnameseDateTimeParser.parse("chủ nhật tuần sau lúc 10h", fixedNow);
    assertEquals(DayOfWeek.SUNDAY, res.startTime().getDayOfWeek());
    assertEquals(10, res.startTime().getHour());
  }

  @Test
  @DisplayName("Parse specific date: 'ngày 28/09 lúc 16h'")
  void testSpecificDate() {
    var res = VietnameseDateTimeParser.parse("ngày 28/09 lúc 16h", fixedNow);
    assertEquals(LocalDate.of(2026, 9, 28), res.startTime().toLocalDate());
    assertEquals(16, res.startTime().getHour());
  }

  @Test
  @DisplayName("Parse duration in hours: 'trong 2 tiếng'")
  void testTwoHoursDuration() {
    var res = VietnameseDateTimeParser.parse("họp lúc 14h trong 2 tiếng", fixedNow);
    assertEquals(14, res.startTime().getHour());
    assertEquals(16, res.endTime().getHour());
  }

  @Test
  @DisplayName("Parse duration: '1 tiếng rưỡi'")
  void testHourAndHalfDuration() {
    var res = VietnameseDateTimeParser.parse("họp lúc 9h trong 1 tiếng rưỡi", fixedNow);
    assertEquals(9, res.startTime().getHour());
    assertEquals(10, res.endTime().getHour());
    assertEquals(30, res.endTime().getMinute());
  }
}
