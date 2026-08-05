package com.assistant.auth.infrastructure.persistence;

import com.assistant.auth.domain.EmailVerificationToken;
import com.assistant.auth.domain.EmailVerificationTokenRepository;
import com.assistant.kernel.domain.UserId;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class EmailVerificationTokenRepositoryAdapter implements EmailVerificationTokenRepository {

  private final SpringDataEmailVerificationTokenRepository springRepository;

  public EmailVerificationTokenRepositoryAdapter(
      SpringDataEmailVerificationTokenRepository springRepository) {
    this.springRepository = springRepository;
  }

  @Override
  public EmailVerificationToken save(EmailVerificationToken token) {
    EmailVerificationTokenJpaEntity jpa = toJpa(token);
    EmailVerificationTokenJpaEntity saved = springRepository.save(jpa);
    return toDomain(saved);
  }

  @Override
  public Optional<EmailVerificationToken> findByToken(String token) {
    return springRepository.findByToken(token).map(this::toDomain);
  }

  @Override
  public Optional<EmailVerificationToken> findByUserId(UserId userId) {
    return springRepository.findByUserId(userId.value()).map(this::toDomain);
  }

  @Override
  public void delete(EmailVerificationToken token) {
    springRepository.deleteById(token.getId());
  }

  @Override
  public void deleteByUserId(UserId userId) {
    springRepository.deleteByUserId(userId.value());
  }

  private EmailVerificationToken toDomain(EmailVerificationTokenJpaEntity jpa) {
    return new EmailVerificationToken(
        jpa.getId(),
        new UserId(jpa.getUserId()),
        jpa.getToken(),
        jpa.getExpiresAt(),
        jpa.getCreatedAt());
  }

  private EmailVerificationTokenJpaEntity toJpa(EmailVerificationToken domain) {
    EmailVerificationTokenJpaEntity jpa = new EmailVerificationTokenJpaEntity();
    jpa.setId(domain.getId());
    jpa.setUserId(domain.getUserId().value());
    jpa.setToken(domain.getToken());
    jpa.setExpiresAt(domain.getExpiresAt());
    jpa.setCreatedAt(domain.getCreatedAt());
    return jpa;
  }
}
