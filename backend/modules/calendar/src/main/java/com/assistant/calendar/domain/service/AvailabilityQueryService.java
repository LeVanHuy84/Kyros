package com.assistant.calendar.domain.service;

import com.assistant.calendar.domain.model.AvailabilityWindow;
import com.assistant.calendar.domain.model.CalendarEvent;
import com.assistant.calendar.domain.model.SlotQuery;
import com.assistant.calendar.domain.model.TimeSlot;
import com.assistant.calendar.domain.repository.CalendarEventRepository;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class AvailabilityQueryService {
  private final CalendarEventRepository calendarEventRepository;

  public AvailabilityQueryService(CalendarEventRepository calendarEventRepository) {
    this.calendarEventRepository = calendarEventRepository;
  }

  public List<AvailabilityWindow> queryAvailability(
      WorkspaceId workspaceId, Instant rangeStart, Instant rangeEnd) {
    List<CalendarEvent> events =
        calendarEventRepository.findActiveEvents(workspaceId, rangeStart, rangeEnd);
    events.sort(Comparator.comparing(e -> e.getTimeRange().startTime()));

    List<AvailabilityWindow> windows = new ArrayList<>();
    Instant cursor = rangeStart;

    for (CalendarEvent event : events) {
      Instant eventStart = event.getTimeRange().startTime();
      Instant eventEnd = event.getTimeRange().endTime();
      if (eventStart.isAfter(cursor)) {
        windows.add(new AvailabilityWindow(cursor, eventStart));
      }
      cursor = eventEnd.isAfter(cursor) ? eventEnd : cursor;
    }

    if (cursor.isBefore(rangeEnd)) {
      windows.add(new AvailabilityWindow(cursor, rangeEnd));
    }

    return windows;
  }

  public List<TimeSlot> discoverSlots(WorkspaceId workspaceId, SlotQuery query) {
    List<AvailabilityWindow> windows =
        queryAvailability(workspaceId, query.rangeStart(), query.rangeEnd());
    List<TimeSlot> slots = new ArrayList<>();

    Instant earliestStart = query.rangeStart().plus(query.minimumNotice());
    Duration desired = query.desiredDuration();

    for (AvailabilityWindow window : windows) {
      Instant candidateStart =
          window.start().isAfter(earliestStart) ? window.start() : earliestStart;
      while (candidateStart.plus(desired).isBefore(window.end())
          || candidateStart.plus(desired).equals(window.end())) {
        if (candidateStart.isBefore(window.end())) {
          slots.add(new TimeSlot(candidateStart, candidateStart.plus(desired)));
        }
        candidateStart = candidateStart.plus(desired);
        if (slots.size() >= query.maxResults()) {
          return slots.stream().limit(query.maxResults()).collect(Collectors.toList());
        }
      }
    }

    return slots.stream().limit(query.maxResults()).collect(Collectors.toList());
  }
}
