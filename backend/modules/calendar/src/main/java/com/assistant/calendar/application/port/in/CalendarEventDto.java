package com.assistant.calendar.application.port.in;

import java.time.Instant;

public record CalendarEventDto(
    String eventId,
    String workspaceId,
    String userId,
    String taskId,
    String title,
    String description,
    Instant startTime,
    Instant endTime,
    String status,
    java.util.List<ReminderDto> reminders,
    Instant createdAt,
    Instant updatedAt,
    int version) {}
