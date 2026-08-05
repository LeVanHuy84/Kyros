package com.assistant.auth.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataUserRepository extends JpaRepository<UserIdentityJpaEntity, UUID> {

  Optional<UserIdentityJpaEntity> findByEmail(String email);
}
