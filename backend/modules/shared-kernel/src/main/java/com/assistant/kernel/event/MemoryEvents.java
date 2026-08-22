package com.assistant.kernel.event;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public final class MemoryEvents {

  private MemoryEvents() {}

  public record ConversationStarted(
      UUID conversationId, WorkspaceId workspaceId, UserId userId, Instant occurredAt)
      implements DomainEvent {
    public ConversationStarted(UUID conversationId, WorkspaceId workspaceId, UserId userId) {
      this(conversationId, workspaceId, userId, Instant.now());
    }
  }

  public record ConversationTurnAppended(
      UUID conversationId,
      WorkspaceId workspaceId,
      UUID turnId,
      String senderRole,
      Instant occurredAt)
      implements DomainEvent {
    public ConversationTurnAppended(
        UUID conversationId, WorkspaceId workspaceId, UUID turnId, String senderRole) {
      this(conversationId, workspaceId, turnId, senderRole, Instant.now());
    }
  }

  public record ConversationCleared(
      UUID conversationId, WorkspaceId workspaceId, Instant occurredAt) implements DomainEvent {
    public ConversationCleared(UUID conversationId, WorkspaceId workspaceId) {
      this(conversationId, workspaceId, Instant.now());
    }
  }

  public record ConversationArchived(
      UUID conversationId, WorkspaceId workspaceId, Instant occurredAt) implements DomainEvent {
    public ConversationArchived(UUID conversationId, WorkspaceId workspaceId) {
      this(conversationId, workspaceId, Instant.now());
    }
  }

  public record UserPreferencesInitialized(
      WorkspaceId workspaceId, UserId userId, Instant occurredAt) implements DomainEvent {
    public UserPreferencesInitialized(WorkspaceId workspaceId, UserId userId) {
      this(workspaceId, userId, Instant.now());
    }
  }

  public record UserPreferencesUpdated(
      WorkspaceId workspaceId, UserId userId, Set<String> changedFields, Instant occurredAt)
      implements DomainEvent {
    public UserPreferencesUpdated(
        WorkspaceId workspaceId, UserId userId, Set<String> changedFields) {
      this(workspaceId, userId, changedFields, Instant.now());
    }
  }

  public record MemoryEntryCreated(
      UUID memoryId,
      WorkspaceId workspaceId,
      UserId userId,
      float confidenceScore,
      Instant occurredAt)
      implements DomainEvent {
    public MemoryEntryCreated(
        UUID memoryId, WorkspaceId workspaceId, UserId userId, float confidenceScore) {
      this(memoryId, workspaceId, userId, confidenceScore, Instant.now());
    }
  }

  public record MemoryEntryUpdated(
      UUID memoryId,
      WorkspaceId workspaceId,
      UserId userId,
      float confidenceScore,
      boolean contentUpdated,
      Instant occurredAt)
      implements DomainEvent {
    public MemoryEntryUpdated(
        UUID memoryId,
        WorkspaceId workspaceId,
        UserId userId,
        float confidenceScore,
        boolean contentUpdated) {
      this(memoryId, workspaceId, userId, confidenceScore, contentUpdated, Instant.now());
    }
  }

  public record MemoryEntryDeleted(UUID memoryId, WorkspaceId workspaceId, Instant occurredAt)
      implements DomainEvent {
    public MemoryEntryDeleted(UUID memoryId, WorkspaceId workspaceId) {
      this(memoryId, workspaceId, Instant.now());
    }
  }

  public record MemoryUpdated(
      WorkspaceId workspaceId, UserId userId, String updateType, Instant occurredAt)
      implements DomainEvent {
    public MemoryUpdated(WorkspaceId workspaceId, UserId userId, String updateType) {
      this(workspaceId, userId, updateType, Instant.now());
    }
  }
}
