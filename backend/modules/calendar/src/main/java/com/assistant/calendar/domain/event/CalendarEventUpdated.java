package com.assistant.calendar.domain.event;

import com.assistant.calendar.domain.model.EventId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.event.DomainEvent;
import java.time.Instant;
import java.util.List;

public record CalendarEventUpdated(
    EventId eventId, WorkspaceId workspaceId, List<String> changedFields, Instant occurredAt)
    implements DomainEvent {}
