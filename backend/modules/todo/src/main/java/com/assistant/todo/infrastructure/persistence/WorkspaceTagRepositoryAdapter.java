package com.assistant.todo.infrastructure.persistence;

import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.domain.model.WorkspaceTag;
import com.assistant.todo.domain.repository.WorkspaceTagRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Repository;

@Repository
public class WorkspaceTagRepositoryAdapter implements WorkspaceTagRepository {

  private final SpringDataWorkspaceTagRepository repo;

  public WorkspaceTagRepositoryAdapter(SpringDataWorkspaceTagRepository repo) {
    this.repo = repo;
  }

  @Override
  public List<WorkspaceTag> findAllByWorkspaceId(WorkspaceId workspaceId) {
    return repo.findAllByWorkspaceIdOrderByNameAsc(workspaceId.value())
        .stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public Optional<WorkspaceTag> findById(UUID id, WorkspaceId workspaceId) {
    return repo.findByIdAndWorkspaceId(id, workspaceId.value()).map(this::toDomain);
  }

  @Override
  public boolean existsByNameAndWorkspaceId(String name, WorkspaceId workspaceId) {
    return repo.existsByNameIgnoreCaseAndWorkspaceId(name, workspaceId.value());
  }

  @Override
  public WorkspaceTag save(WorkspaceTag tag) {
    WorkspaceTagJpaEntity entity = toJpa(tag);
    repo.save(entity);
    return tag;
  }

  @Override
  public void delete(UUID id, WorkspaceId workspaceId) {
    repo.deleteByIdAndWorkspaceId(id, workspaceId.value());
  }

  private WorkspaceTag toDomain(WorkspaceTagJpaEntity e) {
    return new WorkspaceTag(
        e.getId(),
        new WorkspaceId(e.getWorkspaceId()),
        e.getName(),
        e.getColor(),
        e.getCreatedAt());
  }

  private WorkspaceTagJpaEntity toJpa(WorkspaceTag tag) {
    WorkspaceTagJpaEntity e =
        repo.findByIdAndWorkspaceId(tag.getId(), tag.getWorkspaceId().value())
            .orElseGet(WorkspaceTagJpaEntity::new);
    e.setId(tag.getId());
    e.setWorkspaceId(tag.getWorkspaceId().value());
    e.setName(tag.getName());
    e.setColor(tag.getColor());
    e.setCreatedAt(tag.getCreatedAt());
    return e;
  }
}
