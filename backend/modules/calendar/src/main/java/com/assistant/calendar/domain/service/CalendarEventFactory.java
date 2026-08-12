package com.assistant.calendar.domain.service;

import com.assistant.calendar.domain.model.CalendarEvent;
import com.assistant.calendar.domain.model.EventDescription;
import com.assistant.calendar.domain.model.EventId;
import com.assistant.calendar.domain.model.EventTimeRange;
import com.assistant.calendar.domain.model.EventTitle;
import com.assistant.calendar.domain.model.TaskId;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.List;

public class CalendarEventFactory {
  public CalendarEvent create(
      EventId eventId,
      WorkspaceId workspaceId,
      UserId userId,
      TaskId taskId,
      EventTitle title,
      EventDescription description,
      EventTimeRange timeRange,
      List<com.assistant.calendar.domain.model.LeadTime> initialLeadTimes,
      Instant now) {
    return CalendarEvent.create(
        eventId, workspaceId, userId, taskId, title, description, timeRange, initialLeadTimes, now);
  }
}
