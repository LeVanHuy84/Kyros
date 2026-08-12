package com.assistant.calendar.domain.event;

import com.assistant.calendar.domain.model.EventId;
import com.assistant.calendar.domain.model.EventTimeRange;
import com.assistant.calendar.domain.model.ReminderTriggerTime;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.event.DomainEvent;
import java.time.Instant;
import java.util.List;

public record CalendarEventRescheduled(
    EventId eventId,
    WorkspaceId workspaceId,
    EventTimeRange previousTimeRange,
    EventTimeRange newTimeRange,
    List<ReminderTriggerTime> updatedReminderTriggers,
    Instant occurredAt)
    implements DomainEvent {}
