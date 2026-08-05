package com.assistant.kernel.event;

import java.time.Instant;

public interface DomainEvent {
  Instant occurredAt();
}
