package com.assistant.todo.domain.model;

public record Tag(String name) {
  public Tag {
    if (name == null || name.trim().isEmpty()) {
      throw new IllegalArgumentException("Tag name cannot be empty");
    }
    name = name.trim();
  }
}
