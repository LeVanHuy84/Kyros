package com.assistant.auth.infrastructure.persistence;

import com.assistant.auth.domain.AccountStatus;
import com.assistant.auth.domain.SessionEvent;
import com.assistant.auth.domain.UserIdentity;
import com.assistant.auth.domain.UserRepository;
import com.assistant.kernel.domain.UserId;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepositoryAdapter implements UserRepository {

  private final SpringDataUserRepository userRepository;
  private final SpringDataSessionEventRepository sessionEventRepository;

  public UserRepositoryAdapter(
      SpringDataUserRepository userRepository,
      SpringDataSessionEventRepository sessionEventRepository) {
    this.userRepository = userRepository;
    this.sessionEventRepository = sessionEventRepository;
  }

  @Override
  public UserIdentity save(UserIdentity user) {
    UserIdentityJpaEntity jpa = toJpa(user);
    UserIdentityJpaEntity saved = userRepository.save(jpa);
    return toDomain(saved);
  }

  @Override
  public Optional<UserIdentity> findById(UserId id) {
    return userRepository.findById(id.value()).map(this::toDomain);
  }

  @Override
  public Optional<UserIdentity> findByEmail(String email) {
    return userRepository.findByEmail(email).map(this::toDomain);
  }

  @Override
  public void saveSessionEvent(SessionEvent event) {
    SessionEventJpaEntity jpa = toJpa(event);
    sessionEventRepository.save(jpa);
  }

  private UserIdentity toDomain(UserIdentityJpaEntity jpa) {
    return new UserIdentity(
        new UserId(jpa.getId()),
        jpa.getEmail(),
        jpa.getPasswordHash(),
        AccountStatus.valueOf(jpa.getStatus()),
        jpa.getFailedLoginAttempts(),
        jpa.getGlobalRoles(),
        jpa.getCreatedAt(),
        jpa.getUpdatedAt(),
        jpa.getVersion());
  }

  private UserIdentityJpaEntity toJpa(UserIdentity domain) {
    UserIdentityJpaEntity jpa = new UserIdentityJpaEntity();
    jpa.setId(domain.getId().value());
    jpa.setEmail(domain.getEmail());
    jpa.setPasswordHash(domain.getPasswordHash());
    jpa.setStatus(domain.getStatus().name());
    jpa.setFailedLoginAttempts(domain.getFailedLoginAttempts());
    jpa.setGlobalRoles(domain.getGlobalRoles());
    jpa.setCreatedAt(domain.getCreatedAt());
    jpa.setUpdatedAt(domain.getUpdatedAt());
    jpa.setVersion(domain.getVersion());
    return jpa;
  }

  private SessionEventJpaEntity toJpa(SessionEvent domain) {
    SessionEventJpaEntity jpa = new SessionEventJpaEntity();
    jpa.setId(domain.getId());
    jpa.setUserId(domain.getUserId().value());
    jpa.setJti(domain.getJti());
    jpa.setEventType(domain.getEventType());
    jpa.setOccurredAt(domain.getOccurredAt());
    jpa.setMetadata(domain.getMetadata());
    return jpa;
  }
}
