package com.assistant.calendar.domain.model;

public record EventTitle(String value) {
  public EventTitle {
    if (value == null || value.trim().isEmpty()) {
      throw new IllegalArgumentException("Event title cannot be empty");
    }
  }
}
