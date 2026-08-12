package com.assistant.calendar.domain.repository;

import com.assistant.calendar.domain.model.CalendarEvent;
import com.assistant.calendar.domain.model.EventId;
import com.assistant.calendar.domain.model.EventTimeRange;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface CalendarEventRepository {
  CalendarEvent save(CalendarEvent event);

  Optional<CalendarEvent> findById(EventId id, WorkspaceId workspaceId);

  List<CalendarEvent> findOverlappingEvents(
      WorkspaceId workspaceId, EventTimeRange range, EventId excludeEventId);

  List<CalendarEvent> findEventsInWindow(WorkspaceId workspaceId, EventTimeRange range);

  List<CalendarEvent> findEventsWithDueReminders(Instant now);

  List<CalendarEvent> findActiveEvents(
      WorkspaceId workspaceId, Instant rangeStart, Instant rangeEnd);
}
