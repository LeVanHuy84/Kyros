package com.assistant.calendar.domain.event;

import com.assistant.calendar.domain.model.EventId;
import com.assistant.calendar.domain.model.EventTitle;
import com.assistant.calendar.domain.model.ReminderId;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.event.DomainEvent;
import java.time.Instant;

public record ReminderTriggered(
    EventId eventId,
    ReminderId reminderId,
    WorkspaceId workspaceId,
    UserId userId,
    EventTitle eventTitle,
    java.time.Instant eventStartTime,
    Instant triggeredAt)
    implements DomainEvent {
  @Override
  public Instant occurredAt() {
    return triggeredAt;
  }
}
