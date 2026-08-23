package com.assistant.notification.infrastructure.persistence;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.notification.domain.model.InAppNotification;
import com.assistant.notification.domain.model.InAppNotificationStatus;
import com.assistant.notification.domain.model.UrgencyLevel;
import com.assistant.notification.domain.repository.InAppNotificationRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public class InAppNotificationRepositoryAdapter implements InAppNotificationRepository {

  private final SpringDataInAppNotificationRepository repository;

  public InAppNotificationRepositoryAdapter(SpringDataInAppNotificationRepository repository) {
    this.repository = repository;
  }

  @Override
  public void save(InAppNotification notification) {
    repository.save(toJpa(notification));
  }

  @Override
  public Optional<InAppNotification> findById(UUID id, WorkspaceId workspaceId) {
    return repository.findByIdAndWorkspaceId(id, workspaceId.value()).map(this::toDomain);
  }

  @Override
  public List<InAppNotification> findActiveNotificationsForUser(
      WorkspaceId workspaceId, UserId userId) {
    return repository
        .findByWorkspaceIdAndUserIdAndStatusOrderByCreatedAtDesc(
            workspaceId.value(), userId.value(), "Unread")
        .stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public List<InAppNotification> findNotifications(
      WorkspaceId workspaceId, UserId userId, String statusFilter, int offset, int limit) {
    int page = limit > 0 ? offset / limit : 0;
    int size = limit > 0 ? limit : 20;
    Pageable pageable = PageRequest.of(page, size);

    if ("All".equalsIgnoreCase(statusFilter) || statusFilter == null || statusFilter.isEmpty()) {
      return repository
          .findByWorkspaceIdAndUserId(workspaceId.value(), userId.value(), pageable)
          .getContent()
          .stream()
          .map(this::toDomain)
          .collect(Collectors.toList());
    } else {
      return repository
          .findByWorkspaceIdAndUserIdAndStatus(
              workspaceId.value(), userId.value(), statusFilter, pageable)
          .getContent()
          .stream()
          .map(this::toDomain)
          .collect(Collectors.toList());
    }
  }

  @Override
  public long countNotifications(WorkspaceId workspaceId, UserId userId, String statusFilter) {
    if ("All".equalsIgnoreCase(statusFilter) || statusFilter == null || statusFilter.isEmpty()) {
      return repository.countByWorkspaceIdAndUserId(workspaceId.value(), userId.value());
    } else {
      return repository.countByWorkspaceIdAndUserIdAndStatus(
          workspaceId.value(), userId.value(), statusFilter);
    }
  }

  @Override
  public void markAllRead(WorkspaceId workspaceId, UserId userId) {
    repository.markAllRead(workspaceId.value(), userId.value());
  }

  private InAppNotification toDomain(InAppNotificationJpaEntity jpa) {
    return new InAppNotification(
        jpa.getId(),
        new WorkspaceId(jpa.getWorkspaceId()),
        new UserId(jpa.getUserId()),
        jpa.getTitle(),
        jpa.getContent(),
        UrgencyLevel.valueOf(jpa.getUrgencyLevel()),
        InAppNotificationStatus.valueOf(jpa.getStatus()),
        jpa.getReadAt(),
        jpa.getDismissedAt(),
        jpa.getCreatedAt(),
        jpa.getUpdatedAt(),
        jpa.getMetadata(),
        jpa.getVersion());
  }

  private InAppNotificationJpaEntity toJpa(InAppNotification domain) {
    InAppNotificationJpaEntity jpa = new InAppNotificationJpaEntity();
    jpa.setId(domain.getId());
    jpa.setWorkspaceId(domain.getWorkspaceId().value());
    jpa.setUserId(domain.getUserId().value());
    jpa.setTitle(domain.getTitle());
    jpa.setContent(domain.getContent());
    jpa.setUrgencyLevel(domain.getUrgencyLevel().name());
    jpa.setStatus(domain.getStatus().name());
    jpa.setReadAt(domain.getReadAt());
    jpa.setDismissedAt(domain.getDismissedAt());
    jpa.setCreatedAt(domain.getCreatedAt());
    jpa.setUpdatedAt(domain.getUpdatedAt());
    jpa.setMetadata(domain.getMetadata());
    jpa.setVersion(domain.getVersion());
    return jpa;
  }
}
