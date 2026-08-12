package com.assistant.calendar.application.port.in;

import java.time.Instant;

public record ReminderDto(
    String reminderId, int leadTimeMinutes, Instant triggerTime, String status) {}
