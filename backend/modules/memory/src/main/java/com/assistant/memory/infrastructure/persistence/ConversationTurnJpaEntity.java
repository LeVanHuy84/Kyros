package com.assistant.memory.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversation_turns", schema = "memory")
public class ConversationTurnJpaEntity {

  @Id
  @Column(name = "id")
  private UUID id;

  @Column(name = "conversation_id", nullable = false)
  private UUID conversationId;

  @Column(name = "sender_role", nullable = false)
  private String senderRole;

  @Column(name = "content", nullable = false)
  private String content;

  @Column(name = "turn_timestamp", nullable = false)
  private Instant turnTimestamp;

  public ConversationTurnJpaEntity() {}

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getConversationId() {
    return conversationId;
  }

  public void setConversationId(UUID conversationId) {
    this.conversationId = conversationId;
  }

  public String getSenderRole() {
    return senderRole;
  }

  public void setSenderRole(String senderRole) {
    this.senderRole = senderRole;
  }

  public String getContent() {
    return content;
  }

  public void setContent(String content) {
    this.content = content;
  }

  public Instant getTurnTimestamp() {
    return turnTimestamp;
  }

  public void setTurnTimestamp(Instant turnTimestamp) {
    this.turnTimestamp = turnTimestamp;
  }
}
