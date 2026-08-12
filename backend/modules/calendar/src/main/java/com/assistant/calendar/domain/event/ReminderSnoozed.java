package com.assistant.calendar.domain.event;

import com.assistant.calendar.domain.model.EventId;
import com.assistant.calendar.domain.model.ReminderId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.event.DomainEvent;
import java.time.Instant;

public record ReminderSnoozed(
    EventId eventId,
    ReminderId reminderId,
    WorkspaceId workspaceId,
    java.time.Instant newTriggerTime,
    Instant occurredAt)
    implements DomainEvent {}
