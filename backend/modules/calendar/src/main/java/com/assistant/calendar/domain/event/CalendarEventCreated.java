package com.assistant.calendar.domain.event;

import com.assistant.calendar.domain.model.EventId;
import com.assistant.calendar.domain.model.EventTimeRange;
import com.assistant.calendar.domain.model.EventTitle;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.event.DomainEvent;
import java.time.Instant;

public record CalendarEventCreated(
    EventId eventId,
    WorkspaceId workspaceId,
    UserId userId,
    EventTitle title,
    EventTimeRange timeRange,
    int reminderCount,
    Instant occurredAt)
    implements DomainEvent {}
