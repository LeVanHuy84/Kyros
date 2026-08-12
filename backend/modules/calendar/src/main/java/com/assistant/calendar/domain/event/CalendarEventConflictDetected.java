package com.assistant.calendar.domain.event;

import com.assistant.calendar.domain.model.EventId;
import com.assistant.calendar.domain.model.EventTimeRange;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.event.DomainEvent;
import java.time.Instant;

public record CalendarEventConflictDetected(
    EventId attemptedEventId,
    EventId conflictingEventId,
    WorkspaceId workspaceId,
    EventTimeRange proposedTimeRange,
    Instant occurredAt)
    implements DomainEvent {}
