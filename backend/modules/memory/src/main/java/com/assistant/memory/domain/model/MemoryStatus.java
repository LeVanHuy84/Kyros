package com.assistant.memory.domain.model;

/** Lifecycle states for an atomic memory entry in the Vault. */
public enum MemoryStatus {
  /** Memory fact is active, verified, and eligible for prompt injection / RAG retrieval */
  ACTIVE,

  /** Memory fact was superseded/overridden by a newer contradicting fact */
  SUPERSEDED,

  /** Memory fact decayed below threshold or was archived due to age/relevance */
  ARCHIVED,

  /** Temporary contextual memory that expired its time-to-live */
  EXPIRED
}
