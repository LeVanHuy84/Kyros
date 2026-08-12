package com.assistant.calendar.application.port.in;

import com.assistant.calendar.domain.model.EventId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;

public interface CalendarPort {
  EventId createEvent(
      WorkspaceId workspaceId,
      String userId,
      String taskId,
      String title,
      String description,
      Instant startTime,
      Instant endTime,
      List<Integer> reminderOffsetsMinutes);

  void rescheduleEvent(
      WorkspaceId workspaceId, EventId eventId, Instant startTime, Instant endTime);

  void deleteEvent(WorkspaceId workspaceId, EventId eventId);

  void updateEventMetadata(
      WorkspaceId workspaceId, EventId eventId, String title, String description);

  void snoozeReminder(
      WorkspaceId workspaceId, EventId eventId, String reminderId, int snoozeMinutes);

  void dismissReminder(WorkspaceId workspaceId, EventId eventId, String reminderId);

  void addReminder(WorkspaceId workspaceId, EventId eventId, int leadTimeMinutes);

  void removeReminder(WorkspaceId workspaceId, EventId eventId, String reminderId);

  CalendarEventDto getEvent(WorkspaceId workspaceId, EventId eventId);

  List<CalendarEventDto> listEvents(WorkspaceId workspaceId, Instant startTime, Instant endTime);

  List<AvailabilityWindowDto> queryAvailability(
      WorkspaceId workspaceId,
      Instant rangeStart,
      Instant rangeEnd,
      LocalTime workingHoursStart,
      LocalTime workingHoursEnd,
      int minimumNoticeMinutes);

  List<TimeSlotDto> discoverSlots(
      WorkspaceId workspaceId,
      Instant rangeStart,
      Instant rangeEnd,
      Duration desiredDuration,
      LocalTime workingHoursStart,
      LocalTime workingHoursEnd,
      int minimumNoticeMinutes,
      int maxResults);
}
