package com.assistant.calendar.domain.model;

public record EventDescription(String value) {
  public EventDescription {
    if (value != null && value.trim().isEmpty()) {
      throw new IllegalArgumentException("Event description cannot be blank");
    }
  }
}
