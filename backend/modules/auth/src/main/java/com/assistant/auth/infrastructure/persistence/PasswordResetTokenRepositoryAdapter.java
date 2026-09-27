package com.assistant.auth.infrastructure.persistence;

import com.assistant.auth.domain.PasswordResetToken;
import com.assistant.auth.domain.PasswordResetTokenRepository;
import com.assistant.kernel.domain.UserId;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class PasswordResetTokenRepositoryAdapter implements PasswordResetTokenRepository {

  private final SpringDataPasswordResetTokenRepository springRepository;

  public PasswordResetTokenRepositoryAdapter(
      SpringDataPasswordResetTokenRepository springRepository) {
    this.springRepository = springRepository;
  }

  @Override
  public PasswordResetToken save(PasswordResetToken token) {
    PasswordResetTokenJpaEntity jpa = toJpa(token);
    PasswordResetTokenJpaEntity saved = springRepository.save(jpa);
    return toDomain(saved);
  }

  @Override
  public Optional<PasswordResetToken> findByToken(String token) {
    return springRepository.findByToken(token).map(this::toDomain);
  }

  @Override
  public Optional<PasswordResetToken> findByUserId(UserId userId) {
    return springRepository.findByUserId(userId.value()).map(this::toDomain);
  }

  @Override
  public void delete(PasswordResetToken token) {
    springRepository.deleteById(token.getId());
  }

  @Override
  public void deleteByUserId(UserId userId) {
    springRepository.deleteByUserId(userId.value());
  }

  private PasswordResetToken toDomain(PasswordResetTokenJpaEntity jpa) {
    return new PasswordResetToken(
        jpa.getId(),
        new UserId(jpa.getUserId()),
        jpa.getToken(),
        jpa.getExpiresAt(),
        jpa.getCreatedAt());
  }

  private PasswordResetTokenJpaEntity toJpa(PasswordResetToken domain) {
    PasswordResetTokenJpaEntity jpa = new PasswordResetTokenJpaEntity();
    jpa.setId(domain.getId());
    jpa.setUserId(domain.getUserId().value());
    jpa.setToken(domain.getToken());
    jpa.setExpiresAt(domain.getExpiresAt());
    jpa.setCreatedAt(domain.getCreatedAt());
    return jpa;
  }
}
