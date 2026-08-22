package com.assistant.memory.infrastructure.persistence;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.UserPreferences;
import com.assistant.memory.domain.repository.UserPreferencesRepository;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Repository;

@Repository
public class UserPreferencesRepositoryAdapter implements UserPreferencesRepository {

  private final SpringDataUserPreferencesRepository repository;

  public UserPreferencesRepositoryAdapter(SpringDataUserPreferencesRepository repository) {
    this.repository = repository;
  }

  @Override
  public Optional<UserPreferences> find(WorkspaceId workspaceId, UserId userId) {
    return repository
        .findByWorkspaceIdAndUserId(workspaceId.value(), userId.value())
        .map(this::toDomain);
  }

  @Override
  public void save(UserPreferences preferences) {
    UserPreferencesJpaEntity jpa = toJpa(preferences);
    repository.save(jpa);
  }

  private UserPreferences toDomain(UserPreferencesJpaEntity jpa) {
    Set<String> channels =
        new HashSet<>(Arrays.asList(jpa.getPreferredNotificationChannels().split(",")));
    return new UserPreferences(
        jpa.getId(),
        new WorkspaceId(jpa.getWorkspaceId()),
        new UserId(jpa.getUserId()),
        jpa.getTimezone(),
        jpa.getDefaultTaskPriority(),
        jpa.isPreventCalendarOverlap(),
        channels,
        jpa.getDefaultReminderLeadTimeMinutes(),
        jpa.getCreatedAt(),
        jpa.getUpdatedAt(),
        jpa.getVersion());
  }

  private UserPreferencesJpaEntity toJpa(UserPreferences domain) {
    UserPreferencesJpaEntity jpa = new UserPreferencesJpaEntity();
    jpa.setId(domain.getId());
    jpa.setWorkspaceId(domain.getWorkspaceId().value());
    jpa.setUserId(domain.getUserId().value());
    jpa.setTimezone(domain.getTimezone());
    jpa.setDefaultTaskPriority(domain.getDefaultTaskPriority());
    jpa.setPreventCalendarOverlap(domain.isPreventCalendarOverlap());
    jpa.setPreferredNotificationChannels(
        String.join(",", domain.getPreferredNotificationChannels()));
    jpa.setDefaultReminderLeadTimeMinutes(domain.getDefaultReminderLeadTimeMinutes());
    jpa.setCreatedAt(domain.getCreatedAt());
    jpa.setUpdatedAt(domain.getUpdatedAt());
    jpa.setVersion(domain.getVersion());
    return jpa;
  }
}
