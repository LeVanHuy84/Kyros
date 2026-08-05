package com.assistant.auth.infrastructure.persistence;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataSessionEventRepository
    extends JpaRepository<SessionEventJpaEntity, UUID> {}
