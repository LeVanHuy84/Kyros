package com.assistant.notification.infrastructure.persistence;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.notification.domain.model.NotificationChannel;
import com.assistant.notification.domain.model.NotificationProfile;
import com.assistant.notification.domain.model.UrgencyLevel;
import com.assistant.notification.domain.repository.NotificationProfileRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.EnumMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Repository;

@Repository
public class NotificationProfileRepositoryAdapter implements NotificationProfileRepository {

  private final SpringDataNotificationProfileRepository repository;
  private final ObjectMapper objectMapper;

  public NotificationProfileRepositoryAdapter(
      SpringDataNotificationProfileRepository repository, ObjectMapper objectMapper) {
    this.repository = repository;
    this.objectMapper = objectMapper;
  }

  @Override
  public void save(NotificationProfile profile) {
    repository.save(toJpa(profile));
  }

  @Override
  public Optional<NotificationProfile> findByCompositeKey(WorkspaceId workspaceId, UserId userId) {
    return repository
        .findByWorkspaceIdAndUserId(workspaceId.value(), userId.value())
        .map(this::toDomain);
  }

  private NotificationProfile toDomain(NotificationProfileJpaEntity jpa) {
    return new NotificationProfile(
        jpa.getId(),
        new WorkspaceId(jpa.getWorkspaceId()),
        new UserId(jpa.getUserId()),
        deserializeMap(jpa.getUrgencyChannelsMap()),
        jpa.getEmailAddress(),
        jpa.getSlackWebhookReference(),
        jpa.getConsentPolicy(),
        jpa.getDigestSchedule(),
        jpa.getLastDigestSentAt(),
        jpa.getNextDigestAt(),
        jpa.getCreatedAt(),
        jpa.getUpdatedAt(),
        jpa.getVersion());
  }

  private NotificationProfileJpaEntity toJpa(NotificationProfile domain) {
    NotificationProfileJpaEntity jpa = new NotificationProfileJpaEntity();
    jpa.setId(domain.getId());
    jpa.setWorkspaceId(domain.getWorkspaceId().value());
    jpa.setUserId(domain.getUserId().value());
    jpa.setUrgencyChannelsMap(serializeMap(domain.getChannelRoutingMap()));
    jpa.setEmailAddress(domain.getEmailAddress());
    jpa.setSlackWebhookReference(domain.getSlackWebhookReference());
    jpa.setConsentPolicy(domain.getConsentPolicy());
    jpa.setDigestSchedule(domain.getDigestSchedule());
    jpa.setLastDigestSentAt(domain.getLastDigestSentAt());
    jpa.setNextDigestAt(domain.getNextDigestAt());
    jpa.setCreatedAt(domain.getCreatedAt());
    jpa.setUpdatedAt(domain.getUpdatedAt());
    jpa.setVersion(domain.getVersion());
    return jpa;
  }

  private String serializeMap(Map<UrgencyLevel, Set<NotificationChannel>> map) {
    try {
      Map<String, Set<String>> stringMap = new java.util.HashMap<>();
      for (Map.Entry<UrgencyLevel, Set<NotificationChannel>> entry : map.entrySet()) {
        stringMap.put(
            entry.getKey().name(),
            entry.getValue().stream().map(Enum::name).collect(Collectors.toSet()));
      }
      return objectMapper.writeValueAsString(stringMap);
    } catch (IOException e) {
      throw new IllegalArgumentException("Failed to serialize channel routing map", e);
    }
  }

  private Map<UrgencyLevel, Set<NotificationChannel>> deserializeMap(String json) {
    if (json == null || json.isEmpty()) {
      return Map.of();
    }
    try {
      Map<String, Set<String>> rawMap =
          objectMapper.readValue(json, new TypeReference<Map<String, Set<String>>>() {});
      Map<UrgencyLevel, Set<NotificationChannel>> map = new EnumMap<>(UrgencyLevel.class);
      for (Map.Entry<String, Set<String>> entry : rawMap.entrySet()) {
        UrgencyLevel level = UrgencyLevel.valueOf(entry.getKey());
        Set<NotificationChannel> channels =
            entry.getValue().stream().map(NotificationChannel::valueOf).collect(Collectors.toSet());
        map.put(level, channels);
      }
      return map;
    } catch (IOException e) {
      throw new IllegalArgumentException("Failed to deserialize channel routing map: " + json, e);
    }
  }
}
