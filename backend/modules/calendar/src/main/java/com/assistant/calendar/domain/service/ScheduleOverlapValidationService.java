package com.assistant.calendar.domain.service;

import com.assistant.calendar.domain.model.EventId;
import com.assistant.calendar.domain.model.EventTimeRange;
import com.assistant.calendar.domain.model.OverlapPolicyContext;
import com.assistant.calendar.domain.repository.CalendarEventRepository;
import com.assistant.kernel.domain.WorkspaceId;

public class ScheduleOverlapValidationService {
  private final CalendarEventRepository calendarEventRepository;

  public ScheduleOverlapValidationService(CalendarEventRepository calendarEventRepository) {
    this.calendarEventRepository = calendarEventRepository;
  }

  public boolean hasOverlap(
      WorkspaceId workspaceId,
      EventTimeRange timeRange,
      EventId excludeEventId,
      OverlapPolicyContext policy) {
    if (!policy.preventCalendarOverlap()) {
      return false;
    }
    return calendarEventRepository
        .findOverlappingEvents(workspaceId, timeRange, excludeEventId)
        .stream()
        .anyMatch(
            event ->
                event.getStatus() == com.assistant.calendar.domain.model.EventStatus.Scheduled);
  }
}
