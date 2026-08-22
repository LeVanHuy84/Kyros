package com.assistant.memory.infrastructure.persistence;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.MemoryEntry;
import com.assistant.memory.domain.model.MemoryId;
import com.assistant.memory.domain.repository.MemoryEntryRepository;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public class MemoryEntryRepositoryAdapter implements MemoryEntryRepository {

  private final SpringDataMemoryEntryRepository repository;

  public MemoryEntryRepositoryAdapter(SpringDataMemoryEntryRepository repository) {
    this.repository = repository;
  }

  @Override
  public Optional<MemoryEntry> findById(MemoryId id, WorkspaceId workspaceId) {
    return repository.findByIdAndWorkspaceId(id.value(), workspaceId.value()).map(this::toDomain);
  }

  @Override
  public List<MemoryEntry> findByUser(
      WorkspaceId workspaceId, UserId userId, int offset, int limit) {
    int page = limit > 0 ? offset / limit : 0;
    Pageable pageable = PageRequest.of(page, limit > 0 ? limit : 20);
    return repository
        .findByWorkspaceIdAndUserId(workspaceId.value(), userId.value(), pageable)
        .getContent()
        .stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public long countByUser(WorkspaceId workspaceId, UserId userId) {
    return repository.countByWorkspaceIdAndUserId(workspaceId.value(), userId.value());
  }

  @Override
  public List<MemoryEntry> findBySemanticQuery(
      WorkspaceId workspaceId, String queryText, int limit, double confidenceThreshold) {
    Pageable pageable = PageRequest.of(0, limit);
    return repository
        .findBySemanticQuery(workspaceId.value(), queryText, (float) confidenceThreshold, pageable)
        .stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public void save(MemoryEntry entry) {
    MemoryEntryJpaEntity jpa = toJpa(entry);
    repository.save(jpa);
  }

  @Override
  public void delete(MemoryId id, WorkspaceId workspaceId) {
    repository
        .findByIdAndWorkspaceId(id.value(), workspaceId.value())
        .ifPresent(repository::delete);
  }

  private MemoryEntry toDomain(MemoryEntryJpaEntity jpa) {
    return new MemoryEntry(
        new MemoryId(jpa.getId()),
        new WorkspaceId(jpa.getWorkspaceId()),
        new UserId(jpa.getUserId()),
        jpa.getContent(),
        jpa.getConfidenceScore(),
        jpa.getCreatedAt(),
        jpa.getUpdatedAt(),
        jpa.getVersion());
  }

  private MemoryEntryJpaEntity toJpa(MemoryEntry domain) {
    MemoryEntryJpaEntity jpa = new MemoryEntryJpaEntity();
    jpa.setId(domain.getId().value());
    jpa.setWorkspaceId(domain.getWorkspaceId().value());
    jpa.setUserId(domain.getUserId().value());
    jpa.setContent(domain.getContent());
    jpa.setConfidenceScore(domain.getConfidenceScore());
    jpa.setCreatedAt(domain.getCreatedAt());
    jpa.setUpdatedAt(domain.getUpdatedAt());
    jpa.setVersion(domain.getVersion());
    return jpa;
  }
}
