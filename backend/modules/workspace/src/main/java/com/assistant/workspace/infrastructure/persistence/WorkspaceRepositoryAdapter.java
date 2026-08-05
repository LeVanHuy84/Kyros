package com.assistant.workspace.infrastructure.persistence;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.workspace.domain.Membership;
import com.assistant.workspace.domain.Workspace;
import com.assistant.workspace.domain.WorkspaceRepository;
import com.assistant.workspace.domain.WorkspaceRole;
import com.assistant.workspace.domain.WorkspaceStatus;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Repository;

@Repository
public class WorkspaceRepositoryAdapter implements WorkspaceRepository {

  private final SpringDataWorkspaceRepository workspaceRepository;
  private final SpringDataMembershipRepository membershipRepository;

  public WorkspaceRepositoryAdapter(
      SpringDataWorkspaceRepository workspaceRepository,
      SpringDataMembershipRepository membershipRepository) {
    this.workspaceRepository = workspaceRepository;
    this.membershipRepository = membershipRepository;
  }

  @Override
  public Workspace save(Workspace workspace) {
    WorkspaceJpaEntity jpaEntity = toJpa(workspace);
    WorkspaceJpaEntity saved = workspaceRepository.save(jpaEntity);
    return toDomain(saved);
  }

  @Override
  public Optional<Workspace> findById(WorkspaceId id) {
    return workspaceRepository.findById(id.value()).map(this::toDomain);
  }

  @Override
  public List<Workspace> findByUserId(UserId userId) {
    return workspaceRepository.findByUserId(userId.value()).stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public Optional<Membership> findPrimaryMembership(UserId userId) {
    return membershipRepository.findByUserIdAndIsPrimaryTrue(userId.value()).map(this::toDomain);
  }

  @Override
  public void saveMembership(Membership membership) {
    Optional<WorkspaceJpaEntity> workspaceOpt =
        workspaceRepository.findById(membership.getWorkspaceId().value());
    if (workspaceOpt.isPresent()) {
      MembershipJpaEntity jpaEntity = toJpa(membership, workspaceOpt.get());
      membershipRepository.save(jpaEntity);
    } else {
      throw new IllegalStateException(
          "Cannot save membership because target workspace does not exist");
    }
  }

  @Override
  public boolean existsMembership(WorkspaceId workspaceId, UserId userId) {
    return membershipRepository.existsByWorkspaceIdAndUserId(workspaceId.value(), userId.value());
  }

  @Override
  public Optional<WorkspaceRole> findRole(WorkspaceId workspaceId, UserId userId) {
    return membershipRepository
        .findRoleByWorkspaceIdAndUserId(workspaceId.value(), userId.value())
        .map(WorkspaceRole::valueOf);
  }

  private Workspace toDomain(WorkspaceJpaEntity jpa) {
    List<Membership> domainMemberships =
        jpa.getMemberships().stream().map(this::toDomain).collect(Collectors.toList());

    return new Workspace(
        new WorkspaceId(jpa.getId()),
        jpa.getName(),
        WorkspaceStatus.valueOf(jpa.getStatus()),
        new UserId(jpa.getOwnerId()),
        jpa.getCreatedAt(),
        jpa.getUpdatedAt(),
        jpa.getVersion(),
        domainMemberships);
  }

  private Membership toDomain(MembershipJpaEntity jpa) {
    return new Membership(
        jpa.getId(),
        new WorkspaceId(jpa.getWorkspace().getId()),
        new UserId(jpa.getUserId()),
        WorkspaceRole.valueOf(jpa.getRole()),
        jpa.isPrimary(),
        jpa.getCreatedAt(),
        jpa.getUpdatedAt());
  }

  private WorkspaceJpaEntity toJpa(Workspace domain) {
    WorkspaceJpaEntity jpa = new WorkspaceJpaEntity();
    jpa.setId(domain.getId().value());
    jpa.setName(domain.getName());
    jpa.setStatus(domain.getStatus().name());
    jpa.setOwnerId(domain.getOwnerId().value());
    jpa.setCreatedAt(domain.getCreatedAt());
    jpa.setUpdatedAt(domain.getUpdatedAt());
    jpa.setVersion(domain.getVersion());

    List<MembershipJpaEntity> jpaMemberships =
        domain.getMemberships().stream().map(m -> toJpa(m, jpa)).collect(Collectors.toList());
    jpa.setMemberships(jpaMemberships);

    return jpa;
  }

  private MembershipJpaEntity toJpa(Membership domain, WorkspaceJpaEntity parent) {
    MembershipJpaEntity jpa = new MembershipJpaEntity();
    jpa.setId(domain.getId());
    jpa.setWorkspace(parent);
    jpa.setUserId(domain.getUserId().value());
    jpa.setRole(domain.getRole().name());
    jpa.setPrimary(domain.isPrimary());
    jpa.setCreatedAt(domain.getCreatedAt());
    jpa.setUpdatedAt(domain.getUpdatedAt());
    return jpa;
  }
}
